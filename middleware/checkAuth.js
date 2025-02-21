const JWT = require("jsonwebtoken");
const prisma = require("../prisma"); // ✅ ใช้ Prisma ORM
require("dotenv").config(); // ✅ โหลดค่า .env

module.exports = async (req, res, next) => {
    const token = req.header("x-auth-token");

    console.log("Received Token:", token);

    if (!token) {
        return res.status(400).json({
            "error": [
                { "msg": "No token found" }
            ]
        });
    }

    try {
        // ✅ ตรวจสอบ JWT
        const decoded = JWT.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        // ✅ ดึงข้อมูลผู้ใช้จากฐานข้อมูลผ่าน Prisma
        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        req.userDetails = user; 
        next();
        } catch (error) {
        console.error("JWT Verification Error:", error);
        return res.status(401).json({
            "error": [
                { "msg": "Token invalid" }
            ]
        });
    }
};
