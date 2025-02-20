const express = require("express");
const prisma = require("../prisma");
const myMiddleware = require("../middleware/checkAuth");
const router = express.Router();

//create new form
router.post("/create", async (req, res) => {
    const { title, description, theme, color, questions } = req.body;
        const userID = req.user.id;
        if(!title || !questions || questions.length === 0) {
            return res.status(400).json({error: "please enter your title and question"})
        }
        try {
            const newForm = await prisma.form.create({
                data: {
                    title,
                    description,
                    theme,
                    color,
                    userID,
                    questions: {
                        create: questions.map((q) => ({
                            question: q.text,
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
router.get("/forms/:id", myMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        if(req.user.id !== parseInt (id)) {
            return res.status(403).json({err: "Unauthorized access"});
        }
        if(!user) {
            return res.status(404).json({err: "error not found"})
        }

        const forms = await prisma.form.findMany({
            where: {id},
            include: {question: true},
        }); res.json({forms});
    } catch (err) {
        console.err();
        res.status(500).json({err: "Failed to fetch forms"});
    }
});

//show form(ID)
router.get("/:id", myMiddleware, async (req,res) => {
    const { id } = req.params;
     try{
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
         res.json(form);
     } catch (err) {
        res.status(500).json({err: "Failed to fetch form"});
     }
});

//update form
router.put("/:id", myMiddleware, async (req, res) => {
    const { id } = req.params;
    const { title, description, theme, color, questions } = req.body;
    try {
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
                    create: question.map((p) => ({
                        title: q.text,
                        type: q.type,
                        require: q.require || false,
                        limitAns: q.limitAns || 1,
                        options: q.options.map(options => ({
                            text: options.text,
                        })),
                    })), 
                },
            },
        })
        res.json({msg: "updated form successfully!", updateForm});
    } catch (err) {
        console.err();
        res.status(400).json({err: "Updated form failed"});
    }
});

//delete form
router.delete("/", myMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        const form = await prisma.form.findUnique({ where: { id } });

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


