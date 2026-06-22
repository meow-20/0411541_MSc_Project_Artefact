const User = require("../models/User");
const mongoose = require("mongoose");
const axios = require("axios");

const PYTHON_SERVICE_URL = "http://localhost:5001";

// ---------------------------------------------------------------------------
// POST /biometric/enroll
//
// 1. Validate userId  2. Find user  3. Call Python /enroll (capture + store)
// 4. Mark user as biometric-enabled  5. Return success
//
// The actual template data is stored in MongoDB by the Python service
// (fingerprints.captures or fingerpay.biometrics — whichever it resolves to).
// The Node.js side only needs to link the user.
// ---------------------------------------------------------------------------
const enrollBiometric = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    // 1. Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // 2. Forward userId to Python so it stores it alongside the template
    const pythonRes = await axios.post(
      `${PYTHON_SERVICE_URL}/enroll`,
      { userId },
      { timeout: 30000 },
    );

    const data = pythonRes.data;

    if (!data.success) {
      return res.status(500).json({ error: data.error || "Enrollment failed" });
    }

    // 3. Mark the user as biometric-enabled (template lives in Python's
    //    MongoDB — Node.js doesn't need a separate biometric document)
    user.biometricEnabled = true;
    user.biometricId = data.biometricId || null;
    await user.save();

    console.log(
      "Biometric enrolled for user %s — Python doc: %s",
      userId,
      data.biometricId,
    );

    res.json({
      success: true,
      biometricId: data.biometricId,
      userId: user._id,
      biometricEnabled: true,
      templateLength: data.template_length,
      pageId: data.page_id,
    });
  } catch (err) {
    // Handle Python-originated errors (4xx/5xx responses)
    if (err.response) {
      const errorMsg =
        err.response.data?.error || "Fingerprint service error";
      return res
        .status(err.response.status)
        .json({ error: errorMsg });
    }

    if (err.code === "ECONNREFUSED") {
      return res
        .status(503)
        .json({ error: "Fingerprint sensor service is not running" });
    }

    console.error("Biometric enroll error:", err);
    res.status(500).json({ error: "Enrollment failed: " + err.message });
  }
};

// ---------------------------------------------------------------------------
// POST /biometric/verify
//
// 1. Call Python /match (capture + hardware-level comparison)
// 2. Python returns matched user_id or no-match
// 3. Look up user by the returned user_id  4. Return user info
// ---------------------------------------------------------------------------
const verifyBiometric = async (req, res) => {
  try {
    // 1. Let Python capture the finger and match against stored templates
    const pythonRes = await axios.post(
      `${PYTHON_SERVICE_URL}/match`,
      {},
      { timeout: 30000 },
    );

    const data = pythonRes.data;

    if (!data.success) {
      return res.status(500).json({ error: data.error || "Verification failed" });
    }

    // 2. No match — finger scanned but doesn't match any enrolled user
    if (!data.matched) {
      console.log("Biometric verify — no match (score: %d)", data.score || 0);
      return res.status(400).json({
        verified: false,
        score: data.score || 0,
        error: "No matching fingerprint found",
      });
    }

    console.log(
      "Biometric verify — matched user_id: %s (score: %d)",
      data.user_id,
      data.score,
    );

    // 3. Look up the matched user (user_id is the MongoDB ObjectId string
    //    that was forwarded during enrollment)
    const user = await User.findById(data.user_id);
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    res.json({
      verified: true,
      score: data.score,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        balance: user.balance,
      },
    });
  } catch (err) {
    if (err.response) {
      const errorMsg =
        err.response.data?.error || "Fingerprint service error";
      return res
        .status(err.response.status)
        .json({ error: errorMsg });
    }

    if (err.code === "ECONNREFUSED") {
      return res
        .status(503)
        .json({ error: "Fingerprint sensor service is not running" });
    }

    console.error("Biometric verify error:", err);
    res.status(500).json({ error: "Verification failed: " + err.message });
  }
};

module.exports = { enrollBiometric, verifyBiometric };
