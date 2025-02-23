const express = require("express");
const prisma = require("../prisma");
const checkAuth = require("../middleware/checkAuth");
const { check, validationResult } = require("express-validator");
const router = express.Router();


//ดึงข้อมูลผู้ใช้
router.get("/:id", checkAuth, async (req, res) => {
    const { id } = req.params;

    try {
        // ค้นหาผู้ใช้จากฐานข้อมูล
        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
            select: { id: true, email: true, createdAt: true }
        });

        //ถ้าไม่พบผู้ใช้
        if (!user) {
            return res.status(404).json({ err: "User not found" });
        }

        //ป้องกันไม่ให้ผู้ใช้ดึงข้อมูลของคนอื่น
        if (req.user.id !== parseInt(id)) {
            return res.status(403).json({ err: "Unauthorized access" });
        }

        //ส่งข้อมูลผู้ใช้กลับไป
        res.json(user);
    } catch (err) {
        console.error(Failed to fetch user data:", err);
        res.status(500).json({ err: "Server error" });
    }
});

//change name
router.put(
    "/change-name/:id",
    checkAuth,
    [check("name", "Name is required").not().isEmpty()],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { name } = req.body;

        try {
            //ป้องกันไม่ให้ผู้ใช้แก้ไขข้อมูลของคนอื่น
            if (parseInt(id) !== req.user.id) {
                return res.status(403).json({ err: "Unauthorized access to change name" });
            }

            // ตรวจสอบว่าผู้ใช้มีอยู่จริง
            const existingUser = await prisma.user.findUnique({
                where: { id: parseInt(id) }
            });

            if (!existingUser) {
                return res.status(404).json({ err: "User not found" });
            }

            //อัปเดตเฉพาะ `name`
            const updatedUser = await prisma.user.update({
                where: { id: parseInt(id) },
                data: { name },
                select: { id: true, name: true, email: true }
            });

            res.json({ msg: "User name updated successfully", user: updatedUser });
        } catch (error) {
            console.error(Error updating user name:", error);
            res.status(500).json({ err: "Server error" });
        }
    }
);

module.exports = router;
