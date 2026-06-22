const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MerchantSchema = new mongoose.Schema({
  company_name: {
    type: String,
    required: true,
  },
  merchant_name: {
    type: String,
    required: true,
  },
  merchantLogo: {
    type: String, // store URL or file path
    default: null,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  address: {
    type: String,
  },
  bank_details: {
    bankName: String,
    accountNumber: String,
    sortCode: String,
  },
  phone_number: {
    type: String,
    required: true,
  },
  balance: {
    type: Number,
    required: true,
    default: 0,
  },
  VAT_number: {
    type: String,
    required: true,
  },
  license_number: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
MerchantSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

MerchantSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("Merchant", MerchantSchema);
