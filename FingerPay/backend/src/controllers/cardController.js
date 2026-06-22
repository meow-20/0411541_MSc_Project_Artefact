import User from "../models/User.js";
import bcrypt from "bcryptjs";

export const saveCardDetails = async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware
    const { cardNumber, cvv, expiryDate, userName } = req.body;

    if (!cardNumber || !cvv || !expiryDate || !userName) {
      return res.status(400).json({ message: "Missing card fields" });
    }

    // clean up number (remove spaces)
    const cleanNumber = cardNumber.replace(/\s/g, "");

    if (cleanNumber.length < 12) {
      return res.status(400).json({ message: "Invalid card number" });
    }

    // hash CVV (for learning only; in real life you should not store CVV at all)
    const cvvHash = await bcrypt.hash(cvv, 10);

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          cardDetails: {
            cardNumber: cleanNumber, // for learning: full number
            cvv: cvvHash,
            expiryDate,              // e.g. "05/25"
            userName,
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
        cardDetails: {
          cardNumber: user.cardDetails.cardNumber,
          expiryDate: user.cardDetails.expiryDate,
          userName: user.cardDetails.userName,
          // do NOT send cvv hash back
        },
      },
    });
  } catch (err) {
    console.error("saveCardDetails error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const topupWithCard = async (req, res) => {
  try {
    const userId = req.user.id; 
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

    // 2. (Placeholder) Process card payment here
    // e.g. await stripe.charges.create(...) or call your bank simulator
    // For now, we assume payment succeeds.

    // 3. Update user balance
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.balance = (user.balance || 0) + numericAmount;
    await user.save();

    // 4. Return updated user (shape matches your login response)
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
        type: "card_topup",
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("Error in topupWithCard:", err);
    return res.status(500).json({ error: "Server error" });
  }
};