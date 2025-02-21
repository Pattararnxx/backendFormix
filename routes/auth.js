const { v4: uuidv4 } = require("uuid");
const express = require("express");
const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const prisma = require("../prisma");
const sendEmail = require("../utils/email");
const { uuid } = require("uuidv4");
require("dotenv").config();

const router = express.Router();

router.post(
  "/signup",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Invalid email format").isEmail(),
    check("password", "Password must be at least 10 characters long").isLength({
      min: 10,
    }),
    check("confirmPassword", "Passwords do not match").custom(
      (value, { req }) => value === req.body.password
    ),
  ],
  async (req, res) => {
    console.log("📌 Start signup process");
    const id = uuidv4();
    const name = "user name";
    const { email, password } = req.body;
    try {
      const existingUser = await prisma.user.findUnique({ where: { email } });

      if (existingUser) {
        return res.status(400).json({ errors: { msg: "User already exists" } });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      console.log("✅ Password hashed successfully");

      const newUser = await prisma.user.create({
        data: { name, email, password: hashedPassword },
      });

      console.log("✅ User inserted into database successfully:", newUser);

      const token = JWT.sign({ id: newUser.id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      }); //แพรอย่าลืมเปลี่ยนตัวนี้นะ

      res.json({
        msg: "Signup successful. Please login!",
        token,
        userID: newUser.id,
      });
    } catch (error) {
      console.error("❌ Signup error:", error);
      res.status(500).json({ msg: "Server error", error });
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
    console.log("📌 Start login process");

    const { email, password } = req.body;

    try {
      const user = await prisma.user.findUnique({ where: { email } });
      console.log(user);
      if (!user) {
        console.log("❌ Invalid Credentials - Email not found");
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid Credentials" }] });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log("❌ Invalid Credentials - Incorrect password");
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid Credentials" }] });
      }

      // 🎫 สร้าง JWT Token
      const token = JWT.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "10h",
      });
      const issuedAt = Date.now()+10*60*60*1000

      
      console.log("✅ Login successful");
      res.json({
        msg: "Login successful",
        token,
        expDate:issuedAt,
        userID: user.id,
        email: user.email,
      });
    } catch (error) {
      console.error("❌ Login error:", error);
      res.status(500).json({ msg: "Server error", error });
    }
  }
);

router.post(
  "/forgot-password",
  [check("email", "Invalid email format").isEmail()],
  async (req, res) => {
    console.log("📌 Start forgot-password process");

    // ✅ ตรวจสอบว่ามีข้อผิดพลาดจาก `express-validator` หรือไม่
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("❌ Validation errors:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    try {
      // 🔍 ตรวจสอบว่าอีเมลนี้มีอยู่ในฐานข้อมูลหรือไม่
      const user = await prisma.user.findUnique({ where: { email } });

      // ✅ แจ้งข้อความเดียวกันเสมอ ไม่บอกว่า Email มีอยู่หรือไม่ เพื่อป้องกันข้อมูลรั่วไหล
      if (!user) {
        console.log("⚠️ Email not found or not registered.");
        return res
          .status(200)
          .json({ msg: "If this email exists, a reset link will be sent." });
      }

      // 🎫 สร้าง Reset Token ที่หมดอายุใน 15 นาที (ใช้ `user.id` แทน `email`)
      const resetToken = JWT.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "15m",
      });

      // 🔗 สร้างลิงก์รีเซ็ตรหัสผ่าน
      const resetURL = `http://formix.com/reset-password/${resetToken}`;

      // 📧 ส่งอีเมลให้ผู้ใช้
      await sendEmail({
        email: user.email,
        subject: "Password Reset Request",
        message: `Click the following link to reset your password:\n\n${resetURL}`,
      });

      console.log("✅ Reset password email sent successfully");
      res
        .status(200)
        .json({ msg: "If this email exists, a reset link will be sent." });
    } catch (error) {
      console.error("❌ Forgot password error:", error);
      res.status(500).json({ msg: "Server error", error });
    }
  }
);

router.post(
  "/reset-password/:token",
  [
    check(
      "newPassword",
      "Password must be at least 6 characters long"
    ).isLength({ min: 6 }),
    check("confirmNewPassword", "Passwords do not match").custom(
      (value, { req }) => value === req.body.newPassword
    ),
  ],
  async (req, res) => {
    console.log("📌 Start reset-password process");

    // ✅ ตรวจสอบว่ามีข้อผิดพลาดจาก `express-validator` หรือไม่
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("❌ Validation errors:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { token } = req.params;
    const { newPassword } = req.body;

    try {
      // 🔑 ตรวจสอบความถูกต้องของ Token
      const decoded = JWT.verify(token, process.env.JWT_SECRET);
      console.log("✅ Token verified successfully");

      // 🔍 ค้นหาผู้ใช้ในฐานข้อมูล
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });

      if (!user) {
        console.log("❌ User not found for the provided token");
        return res.status(400).json({ msg: "Invalid or expired token" });
      }

      // 🔒 Hash Password ใหม่
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      console.log("✅ Password hashed successfully");

      // 🔄 อัปเดตรหัสผ่านใหม่ในฐานข้อมูล
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      console.log("✅ Password reset successful");
      res.json({ msg: "Password reset successful. Please login!" });
    } catch (error) {
      console.error("❌ Reset password error:", error);
      res.status(400).json({ msg: "Invalid or expired token" });
    }
  }
);

router.get("/verify", async (req, res) => {
  console.log("📌 Start token verification process");

  try {
    // ✅ ดึง Token จาก Header
    const token = req.header("x-auth-token");

    if (!token) {
      console.log("❌ No token provided");
      return res.status(401).json({ msg: "No token found" });
    }

    // 🔍 ตรวจสอบความถูกต้องของ Token
    const decoded = JWT.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token verified successfully:", decoded);

    // 🔍 ค้นหาผู้ใช้จาก Token
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      console.log("❌ User not found for the given token");
      return res.status(404).json({ msg: "User not found" });
    }

    console.log("✅ User verified:", user.email);
    res.json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    console.error("❌ Token verification error:", error);
    return res.status(401).json({ msg: "Token invalid" });
  }
});

// router.get("/all", async (req, res) => {
//     connection.query("SELECT email FROM User", (err, results) => {
//         if (err) return res.status(500).json({ msg: "Database error", error: err });

//         res.json(results);
//     });
// });

module.exports = router;
