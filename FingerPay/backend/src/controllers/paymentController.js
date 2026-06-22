const { processBiometricPayment, processPayment } = require('../services/paymentService');

const payWithBiometric = async (req, res) => {
  try {
    const { biometricId, amount } = req.body;

    // Basic validation
    if (!biometricId || typeof biometricId !== 'string' || biometricId.trim() === '') {
      return res.status(400).json({ error: 'Biometric ID is required' });
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    const result = await processBiometricPayment({ biometricId, amount });
    return res.status(200).json({ user: result.user, transaction: result.transaction });
  } catch (error) {
    // Let the error handler middleware deal with known error codes
    throw error;
  }
};

const payWithDefaultMethod = async (req, res) => {
  try {
    const { recipientIdentifier, amount } = req.body;
    const userId = req.user.id; // from auth middleware

    // Basic validation
    if (!recipientIdentifier || typeof recipientIdentifier !== 'string' || recipientIdentifier.trim() === '') {
      return res.status(400).json({ error: 'Recipient identifier is required' });
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    const result = await processPayment({ senderId: userId, recipientIdentifier, amount });
    return res.status(200).json({ user: result.sender, transaction: result.transaction });
  } catch (error) {
    // Let the error handler middleware deal with known error codes
    throw error;
  }
};

module.exports = { payWithBiometric, payWithDefaultMethod };
