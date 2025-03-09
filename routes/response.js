const express = require("express");
const prisma = require("../prisma");
const router = express.Router();

router.post("/submit", async (req, res) => {

    try {
            
        const { formID, email, answer } = req.body;
        if (!formID || !answer || answer.length === 0) {
            return res.status(400).json({ error: "Form ID and answers are required." });
        }

        const formExists = await prisma.form.findUnique({
            where: { id: formID }
        });
        if (!formExists) {
            return res.status(404).json({ error: "Form not found." });
        }

        const questionList = await prisma.question.findMany({
            where: { formID },
            select: { questionID: true, type: true, limitAns: true }
        });
        //ตรวจสอบคำตอบที่ส่งมา
        for (let ans of answer) {

            // //ตรวจสอบคำตอบสำหรับ Multiple Choice หรือ Dropdown
            // if (["multiple-choice", "dropdown"].includes(question.type)) {
            //     if (!Array.isArray(ans.value)) {
            //         return res.status(400).json({ error: `Question ID: ${question.id} requires an array of answers.` });
            //     }
            //     if (ans.value.length > question.limitAns) {
            //         return res.status(400).json({ error: `Question ID: ${question.id} allows only ${question.limitAns} answers.` });
            //     }
            // }

            // //ตรวจสอบคำตอบสำหรับ Text Input
            // if (question.type === "text" && typeof ans.value !== "string") {
            //     return res.status(400).json({ error: `Question ID: ${question.id} requires a text answer.` });
            // }
        }

        //บันทึกคำตอบลงฐานข้อมูล
        const newResponse = await prisma.response.create({
            data: {
                formID,
                email,
                answer: JSON.stringify(answer)
            }
        });

        res.json({ message: "Response submitted successfully!", responseID: newResponse.id });
    } catch (err) {
        console.error("Error submitting response:", err);
        res.status(500).json({ error: "Cannot submit response" });
    }
});

//



module.exports = router;
