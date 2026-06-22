// routes/authRoutes.js
const express = require("express");
const { verifyEmailCode, sendEmailCode } = require("../controllers/authController");

const router = express.Router();

router.post("/send-email-code", sendEmailCode);
router.post("/verify-email-code", verifyEmailCode);

module.exports = router;  