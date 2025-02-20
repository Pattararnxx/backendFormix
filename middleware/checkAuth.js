const JWT = require("jsonwebtoken");
const connection = require("../db");

module.exports = async (req, res, next)=>{
    const token = req.header('x-auth-token');
    
    console.log("Received Token:", token);
    
    console.log("🚀 Received Token:", token); // ✅ Debug Log (เช็คว่ามีค่าไหม)
    console.log("🚀 Headers:", req.headers); // ✅ Debug Log (ดู Headers ทั้งหมด)

    if (!token) {
        return res.status(400).json({
            "error":[
                {
                    "msg": "No token found",
                }
            ]
        })
    }
    
    try {
        const decoded = JWT.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        
        const userId = req.user.id; 
        // ดึงข้อมูลผู้ใช้จากฐานข้อมูล
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
        console.error("JWT Verification Error:", error);
        return res.status(401).json({
            "error":[
                {
                    "msg": "Token invalid",
                }
            ]
        })
    }
}