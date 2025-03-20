const express = require("express");
const prisma = require("../prisma");
const router = express.Router();
router.get("/public/:formID", async (req, res) => {
    try {
        const { formID } = req.params;

        // Fetch the form and include questions and options
        const form = await prisma.form.findUnique({
            where: { id: formID },
            include: {
                questions: {
                    select: {
                        questionID: true,
                        title: true,
                        type: true,
                        required: true, 
                        options: {
                            select: {
                                id: true,
                                text: true,
                                limitAns:true,
                                selectionCount:true
                            }
                        }
                    }
                },
                responses: true
            }
        });

        if (!form) {
            return res.status(404).json({ error: "Form not found." });
        }

        // Count the total number of responses for the form
        const totalResponses = form.responses.length;

        const color = form.color ? JSON.parse(JSON.stringify(form.color)) : null;
        const data = {
            formID: form.id,
            title: form.title,
            description: form.description,
            theme: form.theme,
            archive: form.archive,
            limitForm:form.limitForm,
            color: color,
            totalResponses: totalResponses, 
            questions: form.questions.map(q => ({
                id: q.questionID,
                title: q.title,
                type: q.type,
                required: q.required,
                limitForm: q.limitForm,
                options: q.options.length !== 0
                    ? q.options.map(opt => ({
                        id: opt.id,
                        text: opt.text,
                        limitAns: opt.limitAns,
                        selectionCount:opt.selectionCount
                    }))
                    : null
            }))
        };

        res.json(data);

    } catch (err) {
        console.error("❌ Error fetching form:", err);
        res.status(500).json({ error: "Cannot fetch form data" });
    }
});



  module.exports = router;