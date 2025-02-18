const JWT = require("jsonwebtoken");
const connection = require("../db");
const prisma = require("../prisma");

module.exports = async (req, res, next)=>{
    const token = req.header('x-auth-token');

    if (!token) {
        return res.status(400).json({
            "error":[
                {
                    "msg": "No token found1",
                }
            ]
        })
    }

    try {
        const decoded = JWT.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        
        // ดึงข้อมูลผู้ใช้จากฐานข้อมูล
        const userId = req.user.id; 
        connection.query('SELECT * FROM User WHERE id = ?', [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ msg: "Database error", error: err });
        }

        if (results.length === 0) {
            return res.status(404).json({ msg: "User not found" });
        }

        req.userDetails = results[0]; 
        next(); 
    });
    } catch (error) {
        return res.status(401).json({
            "error":[
                {
                    "msg": "Token invalid",
                }
            ]
        })
    }
}