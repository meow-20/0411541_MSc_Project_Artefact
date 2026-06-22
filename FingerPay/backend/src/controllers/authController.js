// controllers/authController.js
import User from "../models/User.js";
import EmailCode from "../models/EmailCode.js";
import nodemailer from "nodemailer";

export const verifyEmailCode = async (req, res) => {
  try {
    const { userId, code } = req.body;

    const record = await EmailCode.findOne({ userId });
    if (!record) return res.status(400).json({ message: "No code found" });

    if (record.expiresAt < new Date()) {
      return res.status(400).json({ message: "Code expired" });
    }

    if (record.code !== code) {
      return res.status(400).json({ message: "Invalid code" });
    }

    await User.findByIdAndUpdate(userId, { emailVerified: true });
    await EmailCode.deleteOne({ _id: record._id });

    
    
    await User.updateOne(
        { _id: userId },
        { $set: { emailVerified: true } }
    );

    res.status(200).json({ success: true, emailVerified: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error verifying code" });
  }
};
const transporter = nodemailer.createTransport({
  service: "gmail", // or SMTP host
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const generateCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code

export const sendEmailCode = async (req, res) => {
  try {
    console.log("sendEmailCode body:", req.body);

    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      console.log("sendEmailCode: user not found");
      return res.status(404).json({ message: "User not found" });
    }

    const code = generateCode();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await EmailCode.findOneAndUpdate(
      { userId: user._id },
      { code, expiresAt: expiry },
      { upsert: true, new: true }
    );

    console.log("sendEmailCode: sending email to", user.email);

    await transporter.sendMail({
    from: `FingerPay <${process.env.EMAIL_USER}>`, // display name + real address
      to: user.email,
      subject: "Your verification code",
      text: `Your verification code is ${code}. It expires in 10 minutes.`,
    });

    console.log("sendEmailCode: email sent OK");

    res.json({ message: "Code sent" });
  } catch (err) {
    console.error("sendEmailCode error:", err); // 👈 see real cause
    res.status(500).json({ message: "Error sending code" });
  }
};