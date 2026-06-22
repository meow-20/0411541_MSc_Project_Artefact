const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  biometricEnabled: {
    type: Boolean,
    default: false
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  balance: {
    type: Number,
    required: true,
    default: 0
  },
  address: {
    type: String
  },
  phone_number: {
    type: String
  },
  DOB: {
    type: Date
  },
  accountDetails: {
    sortCode: String,
    accountNumber: String,
    userName: String,
    bankName: String
  },
  cardDetails: {
    cardNumber: String,
    cvv: String,
    expiryDate: String,
    userName: String
  },
  defaultPaymentMethod: {
    type: String,
    enum: ['card', 'bank'],
    default: 'card'
  },
  transactions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
    },
  ],
  biometricId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Biometric",
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// UserSchema.index(
//   { biometricId: 1 },
//   { unique: true, partialFilterExpression: { biometricId: { $exists: true } } }
// );

module.exports = mongoose.model('User', UserSchema);