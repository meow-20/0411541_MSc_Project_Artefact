const User = require('../models/User');

const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('name email balance createdAt');
    res.json(users);
  } catch (error) {
    throw error;
  }
};

const getUserWithTransactions = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name email balance createdAt');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const transactions = await Transaction.find({ userId: user._id })
      .sort({ createdAt: -1 }) // most recent first
      .select('amount type description status createdAt');

    res.json({ user, transactions });
  } catch (error) {
    throw error;
  }
};

const saveBankDetails = async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware
    const { sortCode, accountNumber, userName, bankName } = req.body;

    if (!sortCode || !accountNumber || !userName || !bankName) {
      return res.status(400).json({ message: "Missing bank account fields" });
    }

    // Basic validation for sort code (typically 6 digits)
    const cleanedSortCode = sortCode.replace(/\s/g, '');
    if (!/^\d{6}$/.test(cleanedSortCode)) {
      return res.status(400).json({ message: "Invalid sort code. Must be 6 digits." });
    }

    // Basic validation for account number (typically 8 digits)
    const cleanedAccountNumber = accountNumber.replace(/\s/g, '');
    if (!/^\d{8}$/.test(cleanedAccountNumber)) {
      return res.status(400).json({ message: "Invalid account number. Must be 8 digits." });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          accountDetails: {
            sortCode: cleanedSortCode,
            accountNumber: cleanedAccountNumber,
            userName,
            bankName,
          },
        },
      },
      { new: true }
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
        accountDetails: {
          sortCode: user.accountDetails.sortCode,
          accountNumber: user.accountDetails.accountNumber,
          userName: user.accountDetails.userName,
          bankName: user.accountDetails.bankName,
        },
      },
    });
  } catch (err) {
    console.error("saveBankDetails error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const topupWithBank = async (req, res) => {
  try {
    const userId = req.user.id; // set by auth middleware
    const { amount } = req.body;

    // 1. Validate amount
    if (amount === undefined || amount === null) {
      return res.status(400).json({ error: "Amount is required" });
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res
        .status(400)
        .json({ error: "Amount must be a positive number" });
    }

    // 2. (Placeholder) Simulate bank transfer
    // Here you could:
    // - check user.accountDetails exists
    // - call your simulated bank API
    // For now, assume it succeeds.

    // 3. Fetch user and update balance
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // optionally check they have bank details
    // if (!user.accountDetails) {
    //   return res.status(400).json({ error: "No bank account linked" });
    // }

    user.balance = (user.balance || 0) + numericAmount;
    await user.save();

    // 4. Return updated user (same shape as your login response)
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
      transaction: {
        amount: numericAmount,
        type: "bank_topup",
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("Error in topupWithBank:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports = { getUsers, getUserWithTransactions, saveBankDetails, topupWithBank };
