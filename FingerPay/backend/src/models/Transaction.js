const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    merchant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Merchant",
      required: true,
    },
    merchantName: {
      type: String,
      required: true,
      trim: true,
    },
    merchantImage: {
      type: String, // URL or image key
      default: null,
    },
    amount: {
      type: Number,
      required: true,
    },
    // you can store both date and time in one Date field
    createdAt: {
      type: Date,
      default: Date.now,
    },
    // optional extra fields:
    // type: { type: String, enum: ["card_topup", "bank_topup", "payment"], required: true },
    // description: { type: String },
  },
  {
    // adds createdAt / updatedAt automatically
    timestamps: true,
  }
);

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;