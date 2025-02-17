const router = require("express").Router();
const { check, validationResult } = require("express-validator");
const sendEmail = require('../utils/email');
const bcrypt = require("bcrypt");
const connection = require("../db");
const JWT = require("jsonwebtoken");
require("dotenv").config();


router.post('/signup', async (req, res) => {
    const { email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).json({ errors: [{ msg: "Passwords do not match" }] });
    }

    // ✅ Check if user exists in MySQL
    connection.query("SELECT * FROM User WHERE email = ?", [email], async (err, results) => {
        if (err) return res.status(500).json({ msg: "Database error", error: err });

        if (results.length > 0) {
            return res.status(400).json({ errors: [{ msg: "This user already exists" }] });
        }

        // ✅ Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // ✅ Insert new user into MySQL
        connection.query("INSERT INTO User (email, password) VALUES (?, ?)", [email, hashedPassword], (err, result) => {
            if (err) return res.status(500).json({ msg: "Database error", error: err });

            const token = JWT.sign({ email }, process.env.JWT_SECRET, { expiresIn: "10h" });
            res.json({ token });
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
            return res.status(400).json({ msg: "Email not found" });
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