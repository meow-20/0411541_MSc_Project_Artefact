// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Known error codes from our services/controllers
  if (err.code === 'UNKNOWN_BIOMETRIC') {
    return res.status(404).json({ error: 'Biometric ID not recognized' });
  }

  if (err.code === 'INSUFFICIENT_FUNDS') {
    return res.status(400).json({ error: 'Insufficient funds' });
  }

  if (err.code === 'INVALID_AMOUNT') {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }

  // Default to 500 for unexpected errors
  res.status(500).json({ error: 'Internal server error' });
};

module.exports = errorHandler;
