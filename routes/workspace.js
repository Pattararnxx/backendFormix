const express = require("express");
const prisma = require("../prisma");
const checkAuth = require("../middleware/checkAuth");
const router = express.Router();

router.get("/getForm", checkAuth, async (req, res) => {
    const userID = req.user?.id;

    if (!userID) {
        return res.status(401).json({ error: "Unauthorized: No userID" });
    }

    try {
        const forms = await prisma.form.findMany({
            where: { userID: userID },
            select: {
                id: true,
                title: true,
                theme:true,
                active: true,
            },
        });

        if (!forms || forms.length === 0) {
            return res.status(404).json({ error: "No forms found" });
        }

        const formattedForms = forms.map((form) => ({
            name: form.title,
            archive: !form.active,
            proflieId: form.theme,
            status: false,
        }));
        console.log(formattedForms)
        res.json(formattedForms);
    } catch (error) {
        console.error("Error fetching forms:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
