const mongoose = require('mongoose');

const biometricSchema = new mongoose.Schema({
  // userId references the User this biometric belongs to.
  // NOTE: Template data is stored by the Python fingerprint service in its
  // own MongoDB collection — this model exists for schema completeness.
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  biometricEnabled: {
    type: Boolean,
    default: false,
  },
  sensor: {
    type: String,
    default: "AS608",
  },
}, { timestamps: true });

const Biometric = mongoose.model("Biometric", biometricSchema);
module.exports = Biometric;
