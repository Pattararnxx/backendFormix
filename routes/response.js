const express = require("express");
const prisma = require("../prisma");
const router = express.Router();

// ✅ 1. บันทึกคำตอบของแบบฟอร์ม
router.post("/submit", async (req, res) => {
    const { formID, responses } = req.body; // ✅ ดึง formID จาก req.body

    try {
        // ✅ ดึงข้อมูลคำถามทั้งหมดของแบบฟอร์มจากฐานข้อมูล
        const questionList = await prisma.question.findMany({
            where: { formID },
            select: { id: true, type: true, limitAns: true }
        });

        // ✅ ตรวจสอบคำตอบที่ส่งมา
        for (let answer of responses) {
            const question = questionList.find(q => q.id === answer.questionID);

            if (!question) {
                return res.status(400).json({ error: `Invalid question ID: ${answer.questionID}` });
            }

            // ✅ ตรวจสอบคำตอบสำหรับ Multiple Choice หรือ Dropdown
            if (["multiple-choice", "dropdown"].includes(question.type)) {
                if (!Array.isArray(answer.value)) {
                    return res.status(400).json({ error: `Question ID: ${question.id} requires an array of answers.` });
                }
                if (answer.value.length > question.limitAns) {
                    return res.status(400).json({ error: `Question ID: ${question.id} allows only ${question.limitAns} answers.` });
                }
            }

            // ✅ ตรวจสอบคำตอบสำหรับ Text Input
            if (question.type === "text" && typeof answer.value !== "string") {
                return res.status(400).json({ error: `Question ID: ${question.id} requires a text answer.` });
            }
        }

        // ✅ บันทึกคำตอบลงฐานข้อมูล
        const newResponse = await prisma.response.create({
            data: {
                formID,
                answer: JSON.stringify(responses) // ✅ เก็บคำตอบเป็น JSON
            }
        });

        res.json({ message: "Response submitted successfully!", responseID: newResponse.id });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Cannot submit response" });
    }
});

module.exports = router;
