const express = require("express");
const prisma = require("../prisma");

const router = express.Router();

router.post('', async (req, res) => {
    const {title, question} = req.body
    if(!title || !question || question.length === 0) {
        return res.status(400).json({error: "please enter your title and question"})
    }

    try {
        const newForm = await prisma.form.create({
            data: {
                title,
                question: {
                    create: question.map((p) => ({
                        title: q.text,
                        type: q.type,
                        require: q.require || false,
                        options: q.options ? JSON.stringify(q.options) : null,
                        limitAns: q.limitAns || 1
                    })), 
                },
            },
            include: { question: true},
        });
        res.json({id: newForm.id, mgs: "Form created successfully", form: newForm});
    } catch (err) {
        console.error("Failed to create form");
        res.status(500).send();
    }
});

router.get("/", async (req, res) => {
    try {
        const forms = await prisma.form.findMany({
            include: {question: true},
        });
        res.json(forms);
    } catch (err) {
        console.err();
        res.status(500).json({err: "Failed to fetch"});
    }
});

router.put("/:id", async (req, res) => {
    const { id } = req.param;
    const { title } = req.body;
    try {
        const updateForm = await prisma.form.update({
            where: { id },
            where: { title },
        })
        res.json({updateForm});
    } catch (err) {
        console.err();
        res.status(400).json({err: "Updated form failed"});
    }
});

router.delete("/", async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.form.delete({
            where: { id },
        })
        res.json({msg: "Form deleted successfully"});
    } catch (err) {
        res.status(400).json({err: "Can not deleted form!"})
    }
});

module.exports = router;

