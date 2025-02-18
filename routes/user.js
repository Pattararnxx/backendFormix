const express = require("express");
const prisma = require("../prisma");
const connection = require("../db");
const myMiddleware = require("../middleware/checkAuth");
const router = express.Router();

//user id
router.get('/:id', myMiddleware, async (req, res) => {
    const {id} = req.params;

    try{
        if(req.user.id !== parseInt(id)) {
            return res.status(403).json({err: "Unauthorized access"});
        }
        if(!user) {
            return res.status(404).json({err: "error not found"})
        }

        const myProfile = await prisma.User.findUnique({
            where: {id: parseInt(id)},
            Select: {id: true, email: true, createdAt: true},
        }); res.json(myProfile);
    } catch (err) {
        res.status(500).json({err: "Failed to fetch user data"});
    }
});

//change name
router.put('/change-name/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    try {
        if(req.user.id !== parseInt(id)) {
            return res.status(403).json({err: "Unauthorized access to change name"});
        }
        if(!user) {
            return res.status(404).json({err: "error not found"});
        }

        const updateName = await prisma.form.update ({
            where: {id: parseInt(id)},
            Select: {name},
        }); res.json(updateName);
    } catch (err) {
        res.status(500).json({err: "Failed to fetch user update name"})
    }
});

module.exports = router;
