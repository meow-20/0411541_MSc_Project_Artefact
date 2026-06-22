const express = require("express");
const router = express.Router();
const {
  payWithBiometric,
  payWithDefaultMethod,
} = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");
const { chargeCustomer, processTransaction } = require("../controllers/transactionController");
const { protectMerchant } = require("../middleware/merchantAuth");

// POST /api/payments/pay-with-biometric
router.post("/pay-with-biometric", payWithBiometric);

// POST /api/payments/pay
router.post("/pay", payWithDefaultMethod);

router.post("/transactions/pay", protectMerchant, chargeCustomer);
router.post('/process', processTransaction);

module.exports = router;
