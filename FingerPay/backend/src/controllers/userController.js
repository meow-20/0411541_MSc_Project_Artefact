const User = require("../models/User");
const Transaction = require("../models/Transaction");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

const createUser = async (req, res) => {
  try {
    const { name, email, password, phone_number } = req.body;

    // Basic validation for signup step
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required" });
    }

    // Check if user already exists with this email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds); // Hashing the password before storing

    const user = new User({
      name,
      email,
      password: hashedPassword, // store hash, not plain password
      phone_number,
      // biometricId, address, etc. will be added later via profile verification
    });

    await user.save();

    const token = generateToken(user._id);

    // Never send password back
    res.status(201).json(
      {
        id: user._id,
        name: user.name,
        email: user.email,
        phone_number: user.phone_number,
        balance: user.balance,
      },
      token,
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({ error: "Server error while creating user" });
  }
};

const loginUser = async (req, res) => {
  try {
    // console.log("Login request body:", req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      console.log("Missing email or password");
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log("No user found for email:", email);
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    // console.log("Password match?", isMatch);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }
    const token = generateToken(user._id);
    return res.json({
      user: {
        id: user._id,
        email: user.email,
        phone_number: user.phone_number,
        name: user.name,
        balance: user.balance,
        emailVerified: user.emailVerified,
        cardDetails: user.cardDetails,
        accountDetails: user.accountDetails,
      },
      token,
      role: "customer",
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Server error while logging in" });
  }
};

const getMe = async (req, res) => {
  try {
    // protect middleware should set req.user.id or req.user._id
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        balance: user.balance,
        emailVerified: user.emailVerified,
        cardDetails: user.cardDetails
          ? {
              cardNumber: user.cardDetails.cardNumber,
              expiryDate: user.cardDetails.expiryDate,
              userName: user.cardDetails.userName,
            }
          : null,
        accountDetails: user.accountDetails
          ? {
              sortCode: user.accountDetails.sortCode,
              accountNumber: user.accountDetails.accountNumber,
              userName: user.accountDetails.userName,
              bankName: user.accountDetails.bankName,
            }
          : null,
        defaultPaymentMethod: user.defaultPaymentMethod,
      },
    });
  } catch (err) {
    console.error("getMe error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

const getCustomerTransactions = async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware

    const transactions = await Transaction.find({ user: userId })
      .populate("merchant", "company_name merchant_name email merchantLogo")
      .sort({ createdAt: -1 });

      // console.log("Fetched transactions for user:", userId, transactions);

    const formattedTransactions = transactions.map((tx) => ({
      _id: tx._id,
      amount: tx.amount,
      createdAt: tx.createdAt,
      merchantName:
        tx.merchantName ||
        tx.merchant?.company_name ||
        tx.merchant?.merchant_name ||
        tx.merchant?.email ||
        "Unknown Merchant",
      merchantImage: tx.merchantImage || tx.merchant?.merchantLogo || null,
      merchantId: tx.merchant?._id || null,
    }));

    return res.status(200).json({
      success: true,
      transactions: formattedTransactions,
    });
  } catch (error) {
    console.error("Error fetching customer transactions:", error);
    return res.status(500).json({
      error: "Failed to fetch transactions",
    });
  }
};

const saveDefaultPaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware
    const { defaultPaymentMethod } = req.body;

    // Validate that it's either 'card' or 'bank'
    if (
      !defaultPaymentMethod ||
      !["card", "bank"].includes(defaultPaymentMethod)
    ) {
      return res
        .status(400)
        .json({ message: "Invalid default payment method" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          defaultPaymentMethod,
        },
      },
      { new: true },
    ).lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        balance: user.balance,
        emailVerified: user.emailVerified,
        defaultPaymentMethod: user.defaultPaymentMethod,
      },
    });
  } catch (err) {
    console.error("saveDefaultPaymentMethod error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const getUserByEmail = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    console.log("No user found for email:", email);
    return res.status(400).json({ error: "Invalid email or password" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  // console.log("Password match?", isMatch);

  if (!isMatch) {
    return res.status(400).json({ error: "Invalid email or password" });
  }

  // Do NOT send password back
  return res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
};

const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Validate ObjectId format
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    // Find user by ID
    const user = await User.findOne({ _id: userId });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Return user data (convert ObjectId to string)
    res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      balance: user.balance
    });
    
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

module.exports = {
  createUser,
  loginUser,
  getMe,
  saveDefaultPaymentMethod,
  getCustomerTransactions,
  getUserByEmail,
  getUserById,
};
