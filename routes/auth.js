const { v4: uuidv4 } = require("uuid");
const express = require("express");
const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const prisma = require("../prisma");
const sendEmail = require("../utils/email");
require("dotenv").config();

const router = express.Router();

router.post(
  "/signup",
  [
    check("email", "Invalid email format").isEmail(),
    check("password", "Password must be at least 6 characters long").isLength({
      min: 6,
    }),
    check("confirmPassword", "Passwords do not match").custom(
      (value, { req }) => {
        return value === req.body.password;
      }
    ),
  ],
  async (req, res) => {
    console.log("Start signup process");

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, confirmPassword } = req.body;
    try {
      const existingUser = await prisma.user.findUnique({ where: { email } });

      if (existingUser) {
        return res.status(400).json({ errors: [{ msg: "User already exists" }] });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ errors: [{ msg: "Passwords do not match" }] });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await prisma.user.create({
        data: { email, password: hashedPassword },
      });


      const token = JWT.sign({ id: newUser.id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      return res.json({
        msg: "Signup successful. Please login!",
        token,
        userID: newUser.id,
      });
    } catch (error) {
      return res.status(500).json({ msg: "Server error", error });
    }
  }
);

router.post(
  "/login",
  [
    check("email", "Invalid email format").isEmail(),
    check("password", "Password is required").not().isEmpty(),
  ],
  async (req, res) => {
    console.log("Start login process");

    const { email, password } = req.body;

    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res
          .status(400)
          .send({ errors: [{ msg: "Email not found" }] });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .send({ errors: [{ msg: "Incorrect password" }] });
      }

      const token = JWT.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "10h",
      });
      const issuedAt = Date.now()+10*60*60*1000

      res.json({
        msg: "Login successful",
        token,
        expDate:issuedAt,
        userID: user.id,
        email: user.email,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ msg: "Server error", error });
    }
  }
);

router.post(
  '/forgot-password',
  [check('email', 'Invalid email format').isEmail()],
  async (req, res) => {
    console.log('Start forgot-password process');

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    try {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        console.log('Email not found or not registered.');
        return res
          .status(200)
          .json({ msg: 'If this email exists, a reset link will be sent.' });
      }

      // สร้าง token สำหรับ reset password
      const resetToken = JWT.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: '15m',
      });

      // สร้างลิงก์ reset password
      const resetURL = `http://localhost:3000/newpassword/${encodeURIComponent(resetToken)}`;

      // ตั้งค่าข้อความอีเมล (รูปแบบ HTML)
      const emailOptions = {
        email: user.email,
        subject: 'Password Reset Request',
        message: `
          <h1>Password Reset Request</h1>
          <p>Click the link below to reset your password:</p>
          <a href="${resetURL}">Reset Password</a>
          <p>If you did not request this, please ignore this email.</p>
        `,
      };

      // ส่งอีเมล
      await sendEmail(emailOptions);

      console.log('Reset password email sent successfully');
      res
        .status(200)
        .json({ msg: 'If this email exists, a reset link will be sent.' });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ msg: 'Server error', error });
    }
  }
);

router.post(
  "/newpassword/:token",
  [
    check("newPassword", "Password must be at least 6 characters long").isLength({ min: 6 }),
    check("confirmNewPassword", "Passwords do not match").custom(
      (value, { req }) => value === req.body.newPassword
    ),
  ],
  async (req, res) => {
    console.log("Start reset-password process");
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Validation errors:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { token } = req.params;
    const { newPassword } = req.body;

    try {
      // ตรวจสอบ token
      const decoded = JWT.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });

      if (!user) {
        console.log("User not found for the provided token");
        return res.status(400).json({ msg: "Invalid or expired token" });
      }

      // เข้ารหัส password ใหม่
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      return res.json({ msg: "Password reset successful. Please login!" });
    } catch (error) {
      console.error("Error during reset-password:", error);
      return res.status(400).json({ msg: "Invalid or expired token" });
    }
  }
);

router.get("/verify", async (req, res) => {
  console.log("Start token verification process");

  try {
    const token = req.header("x-auth-token");

    if (!token) {
      console.log("No token provided");
      return res.status(401).json({ msg: "No token found" });
    }

    const decoded = JWT.verify(token, process.env.JWT_SECRET);
    console.log("Token verified successfully:", decoded);

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      console.log("User not found for the given token");
      return res.status(404).json({ msg: "User not found" });
    }

    console.log("User verified:", user.email);
    res.json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    console.error("❌ Token verification error:", error);
    return res.status(401).json({ msg: "Token invalid" });
  }
});


module.exports = router;
