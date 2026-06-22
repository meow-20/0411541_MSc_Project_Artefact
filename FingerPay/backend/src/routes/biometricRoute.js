const express = require("express");
const { enrollBiometric, verifyBiometric } = require("../controllers/biometricController");

const router = express.Router();

// POST /biometric/enroll
router.post("/enroll", enrollBiometric);

router.post("/verify", verifyBiometric);

module.exports = router;
