const express = require("express");
const prisma = require("../prisma");
const checkAuth = require("../middleware/checkAuth");
const router = express.Router();

//create new form
router.post("/create", checkAuth, async (req, res) => {
    try {
        const { title, description, theme, color, questions } = req.body;
        const userID = req.user.id || null;
        if(!title || !questions || questions.length === 0) {
            return res.status(400).json({error: "please enter your title and question"})
        }
        if(!userID) {
            return res.status(400).json({err: "User undefine"})
        }
        const newForm = await prisma.form.create({
            data: {
                title,
                description,
                theme,
                color,
                userID, 
                questions: {
                    create: questions.map((q) => ({
                        question: q.question,
                        type: q.type,
                        required: q.required || false,
                        limitAns: q.limitAns || 1,
                        options: q.options? {
                            create: q.options.map(options => ({
                            text: options.text,
                            })),
                        } : undefined,
                    })),
                },
            },
            include: { questions: { include: { options: true} }},
        });
        res.json({id: newForm.id, msg: "Form created successfully", form: newForm});
    } catch (err) {
        console.error("Failed to create form", err);
        res.status(500).send({msg: "Failed to create form"});
    }
});
// show all user form
router.get("/user", checkAuth, async (req, res) => {
    try {
        const userID = req.user.id || null;

        if(req.user.id !== parseInt (id)) {
            return res.status(403).json({err: "Unauthorized access"});
        }
        if(!user) {
            return res.status(404).json({err: "Unauthorized: No user ID found"})
        }

        const forms = await prisma.form.findMany({
            where: { userID },
            include: { questions: { include: { options: true} }},
            orderBy: { createdAt: "desc" }
        }); res.status(200).json({forms});
    } catch (err) {
        console.err("Failed to fetch forms", err);
        res.status(500).json({err: "Failed to fetch forms"});
    }
});

//show form(ID)
router.get("/:id", checkAuth, async (req,res) => {
    try{
        const { id } = req.params;
        const userID = req.user.id || null;

        if (!userID) {
            return res.status(401).json({ error: "Unauthorized: No user ID found" });
        }

        if(req.user.id !== parseInt (id)) {
            return res.status(403).json({err: "Unauthorized access"});
        }

        const form = await prisma.form.findUnique({
            where: {id},
            include: { questions: { include: { options: true} }},
        });
        if (!form) {
            return res.status(404).json({ error: "Form not found" });
        }
         res.status(200).json(form);
     } catch (err) {
        res.status(500).json({err: "Failed to fetch form"});
     }
});

//update form
router.put("/:id", checkAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, theme, color, questions } = req.body;
        const userID = req.user.id || null;

        if (!userID) {
            return res.status(401).json({ error: "Unauthorized: No user ID found" });
        }

        const form = await prisma.form.findUnique({ where: { id } });

        if (!form) {
            return res.status(404).json({ error: "Form not found" });
        }

        if (form.userID !== req.user.id) {
            return res.status(403).json({ error: "Unauthorized to edit this form" });
        }

        const updateForm = await prisma.form.update({
            where: { id },
            data: {
                title,
                description,
                color,
                theme,
                userID,
                questions: {
                    create: questions.map((p) => ({
                        question: q.text,
                        type: q.type,
                        require: q.require || false,
                        limitAns: q.limitAns || 1,
                        options: q.options.map(options => ({
                            text: options.text,
                        })),
                    })), 
                },
            },
            include: { questions: { include: { options: true} }},
        });
        res.json({msg: "updated form successfully!", updateForm});
    } catch (err) {
        console.err( "Updated form failed",err);
        res.status(400).json({err: "Updated form failed"});
    }
});

//delete form
router.delete("/:id", checkAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const userID = req.user.id || null;

        if (!userID) {
            return res.status(401).json({ error: "Unauthorized: No user ID found" });
        }

        const form = await prisma.form.findUnique({
             where: { id } 
            });

        if (!form) {
            return res.status(404).json({ error: "Form not found" });
        }

        if (form.userID !== req.user.id) {
            return res.status(403).json({ error: "Unauthorized to delete this form" });
        }

        await prisma.form.delete({
            where: { id },
        });

        res.json({msg: "Form deleted successfully"});
    } catch (err) {
        res.status(400).json({err: "Can not deleted form!"})
    }
});



module.exports = router;


