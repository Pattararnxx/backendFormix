const router = require("express").Router();
const { check, validationResult } = require("express-validator");
const sendEmail = require('../utils/email');
const bcrypt = require("bcrypt");
const connection = require("../db");
const JWT = require("jsonwebtoken");
require("dotenv").config();

router.post('/signup', async (req, res) => {
    console.log("Start signup process");

    // ตอนนี้ variable name สำคัญเพราะต้องใช้ใน INSERT
    const name = "username";
    const { email, password, confirmPassword } = req.body;

    console.log("Request data:", { email, password, confirmPassword });

    // ตรวจสอบรหัสผ่าน
    if (password !== confirmPassword) {
        console.log("Passwords do not match");
        return res.status(400).json({ errors: [{ msg: "Passwords do not match" }] });
    }

    // ตรวจสอบหากมีผู้ใช้งานที่มีอีเมลนี้อยู่แล้วในฐานข้อมูล
    connection.query("SELECT * FROM User WHERE email = ?", [email], async (err, results) => {
        if (err) {
            console.error("Error querying database:", err);
            return res.status(500).json({ msg: "Database error", error: err });
        }
        
        console.log("User search results:", results);

        if (results.length > 0) {
            console.log("User already exists");
            return res.status(400).json({ errors: [{ msg: "This user already exists" }] });
        }

        // แฮชรหัสผ่าน
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("Password hashed successfully");

        // แทรกผู้ใช้ใหม่เข้าไปใน MySQL โดยแทรกค่าของ name ด้วย
        connection.query("INSERT INTO User (name, email, password) VALUES (?, ?, ?)", [name, email, hashedPassword], (err, result) => {
            if (err) {
                console.error("Error inserting user into database:", err);
                return res.status(500).json({ msg: "Database error", error: err });
            }

            console.log("User inserted into database successfully", result);
            res.json({ msg: "Signup successful. Please login!" });
        });
    });
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    connection.query("SELECT * FROM User WHERE email = ?", [email], async (err, results) => {
        if (err) return res.status(500).json({ msg: "Database error", error: err });

        if (results.length === 0) {
            return res.status(400).json({ errors: [{ msg: "Invalid Credentials" }] });
        }

        let user = results[0]; // ดึงข้อมูล user จาก MySQL
        let isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ errors: [{ msg: "Invalid Credentials" }] });
        }

        const token = JWT.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: "10h" });
        res.json({ token });
    });
});


router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    connection.query("SELECT * FROM User WHERE email = ?", [email], async (err, results) => {
        if (err) return res.status(500).json({ msg: "Database error", error: err });

        if (results.length === 0) {
            return res.status(400).json({ msg: "If this email exists, a reset link will be sent."  });
        }

        const resetToken = JWT.sign({ email }, process.env.JWT_SECRET, { expiresIn: "30m" });
        const resetLink = `http://formix.com/reset-password/${resetToken}`;

        try {
            await sendEmail({
                email: email,
                subject: "Password Reset Request",
                message: `Click the link below to reset your password:\n\n${resetLink}`
            });

            res.status(200).json({ status: 'success', message: 'Password reset link sent to user email' });
        } catch (error) {
            console.error("Email sending error:", error);
            return res.status(500).json({ msg: "Failed to send password reset email" });
        }
    });
});


router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    try {
        // CHECK TOKEN
        const decoded = JWT.verify(token, process.env.JWT_SECRET);

        // FIND USER IN DATABASE
        connection.query("SELECT * FROM User WHERE email = ?", [decoded.email], async (err, results) => {
            if (err) return res.status(500).json({ msg: "Database error", error: err });

            if (results.length === 0) {
                return res.status(400).json({ msg: "Invalid token" });
            }

            // UPDATE RESET PASSWORD
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            connection.query("UPDATE User SET password = ? WHERE email = ?", [hashedPassword, decoded.email], (err, result) => {
                if (err) return res.status(500).json({ msg: "Database error", error: err });

                res.json({ msg: "Password has been reset successfully" });
            });
        });
    } catch (error) {
        res.status(400).json({ msg: "Invalid or expired token" });
    }
});


router.get("/all", async (req, res) => {
    connection.query("SELECT email FROM User", (err, results) => {
        if (err) return res.status(500).json({ msg: "Database error", error: err });

        res.json(results);
    });
});


module.exports = router