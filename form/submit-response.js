const express = require("express");
const prisma = require("../prisma");

const router = express.Router();

router.post("/submit-response", async (req, res) => {
    const { form, response} = req.body;
    try {
        const question = await prisma.form.findMany ({
            where: { formID },
            select: { id: true, type: true, limit: true },
        });
        for (let answer of responses) {
            const question = questions.find(q => q.id === answer.questionID);

            if(!question) {
                return res.status(400).json({err: 'Invalid question ID: ${answer.questionID}'});
            }
            if (["multiple-choice", "dropdown"].includes(question.type)) {
                if(!Array.isArray(answer.value)) {
                    return res.status(400).json({err: 'Question ID: ${question.id} requires an array of answers.'});
                }
                if (answer.value.length > question.limit) {
                    return res.status(400).json({err: 'Question ID: ${question.id} allows only ${questions.limit} answers(s).'});
                }
            }
            if (question.type === "text" && typeof answer.value !== "string" ) {
                return res.status(400).json({err: 'Question ID: ${question.id} requires a text answer'});
            }
        }
        const newResponse = await prisma.response.create ({
            data: {
                formID,
                answer: JSON.stringify(responses),
            },
        });
        res.json({msg: "Response submitted successfully!", responseID: newResponse.id});
    } catch(err) {
        console.log(err);
        res.status(500).json({err: 'Can not submit response'})
    }
})