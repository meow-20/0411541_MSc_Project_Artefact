const express = require('express');
const router = express.Router();
const { getUsers, getUserWithTransactions, saveBankDetails } = require('../controllers/bankController');
const { protect } = require("../middleware/authMiddleware");

// GET /api/bank/users
router.get('/', getUsers);

// GET /api/bank/users/:id
router.get('/:id', getUserWithTransactions);

// POST /api/bank/me/account
router.post('/me/account', protect, saveBankDetails);

module.exports = router;