const express = require("express");
const prisma = require("../prisma");
const checkAuth = require("../middleware/checkAuth");
const router = express.Router();

router.get("/getForm", checkAuth, async (req, res) => {
    try {
        const userID = req.user?.id;

        if (!userID) {
            return res.status(401).json({ error: "Unauthorized: No userID" });
        }

        // ดึงข้อมูล email ของผู้ใช้
        const user = await prisma.user.findUnique({
            where: { id: userID },
            select: { email: true },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // ดึงข้อมูลฟอร์มทั้งหมดของผู้ใช้
        const forms = await prisma.form.findMany({
            where: { userID: userID },
            select: {
                id: true,
                title: true,
                theme: true,
                active: true,
            },
        });

        if (forms.length === 0) {
            return res.status(404).json({ error: "No forms found" });
        }

        const totalForm = forms.length;
        const activeForm = forms.filter(form => form.active).length;

        const formattedForms = forms.map((form) => ({
            name: form.title,
            archive: !form.active,
            proflieId: form.theme,
            status: false,
        }));

        res.json({
            totalForm,
            activeForm,
            email: user.email,
            forms: formattedForms,
        });

    } catch (error) {
        console.error("❌ Error fetching forms:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
