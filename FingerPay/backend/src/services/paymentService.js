const User = require('../models/User');
const Transaction = require('../models/Transaction');

const processBiometricPayment = async ({ biometricId, amount }) => {
  // Find user by biometricId
  const user = await User.findOne({ biometricId });
  if (!user) {
    throw { code: 'UNKNOWN_BIOMETRIC', message: 'Biometric ID not recognized' };
  }

  // Check if amount is valid (positive number)
  if (typeof amount !== 'number' || amount <= 0) {
    throw { code: 'INVALID_AMOUNT', message: 'Amount must be a positive number' };
  }

  // Check sufficient balance
  if (user.balance < amount) {
    throw { code: 'INSUFFICIENT_FUNDS', message: 'Insufficient funds' };
  }

  // Deduct amount from user balance
  user.balance -= amount;
  await user.save();

  // Create transaction record
  const transaction = new Transaction({
    userId: user._id,
    amount: amount,
    type: 'debit',
    description: 'Payment via biometric authentication',
    status: 'completed'
  });
  await transaction.save();

  return { user, transaction };
};

const processPayment = async ({ senderId, recipientIdentifier, amount }) => {
  // Find sender
  const sender = await User.findById(senderId);
  if (!sender) {
    throw { code: 'SENDER_NOT_FOUND', message: 'Sender not found' };
  }

  // Validate amount
  if (typeof amount !== 'number' || amount <= 0) {
    throw { code: 'INVALID_AMOUNT', message: 'Amount must be a positive number' };
  }

  // Check sufficient balance
  if (sender.balance < amount) {
    throw { code: 'INSUFFICIENT_FUNDS', message: 'Insufficient funds' };
  }

  // Find recipient by phone_number or email
  const recipient = await User.findOne({
    $or: [
      { phone_number: recipientIdentifier },
      { email: recipientIdentifier }
    ]
  });
  if (!recipient) {
    throw { code: 'RECIPIENT_NOT_FOUND', message: 'Recipient not found' };
  }

  // Deduct from sender
  sender.balance -= amount;
  await sender.save();

  // Add to recipient
  recipient.balance += amount;
  await recipient.save();

  // Create debit transaction for sender
  const senderTxn = new Transaction({
    userId: sender._id,
    amount: amount,
    type: 'debit',
    description: `Payment to ${recipient.email || recipient.phone_number}`,
    status: 'completed'
  });
  await senderTxn.save();

  // Create credit transaction for recipient
  const recipientTxn = new Transaction({
    userId: recipient._id,
    amount: amount,
    type: 'credit',
    description: `Payment from ${sender.email || sender.phone_number}`,
    status: 'completed'
  });
  await recipientTxn.save();

  // Return sender (updated) and transaction (maybe sender's txn)
  return { sender: sender, transaction: senderTxn };
};

module.exports = { processBiometricPayment, processPayment };
