const express = require("express");
const prisma = require("../prisma");
const router = express.Router();

// บันทึกคำตอบของแบบฟอร์ม
router.post("/submit", async (req, res) => {
    try {
        const userID = req.user.id;
        const { formID, email, answer } = req.body; //ดึง formID และคำตอบจาก req.body

        if (!formID || !answer || answer.length === 0) {
            return res.status(400).json({ error: "Form ID and answers are required." });
        }

        //ตรวจสอบว่า `formID` มีอยู่จริง
        const formExists = await prisma.form.findUnique({
            where: { id: formID }
        });

        if (!formExists) {
            return res.status(404).json({ error: "Form not found." });
        }

        //ดึงข้อมูลคำถามทั้งหมดของแบบฟอร์มจากฐานข้อมูล
        const questionList = await prisma.question.findMany({
            where: { formID },
            select: { id: true, type: true, limitAns: true }
        });

        //ตรวจสอบคำตอบที่ส่งมา
        for (let ans of answer) {
            const question = questionList.find(q => q.id === ans.questionID);

            if (!question) {
                return res.status(400).json({ error: `Invalid question ID: ${ans.questionID}` });
            }

            //ตรวจสอบคำตอบสำหรับ Multiple Choice หรือ Dropdown
            if (["multiple-choice", "dropdown"].includes(question.type)) {
                if (!Array.isArray(ans.value)) {
                    return res.status(400).json({ error: `Question ID: ${question.id} requires an array of answers.` });
                }
                if (ans.value.length > question.limitAns) {
                    return res.status(400).json({ error: `Question ID: ${question.id} allows only ${question.limitAns} answers.` });
                }
            }

            //ตรวจสอบคำตอบสำหรับ Text Input
            if (question.type === "text" && typeof ans.value !== "string") {
                return res.status(400).json({ error: `Question ID: ${question.id} requires a text answer.` });
            }
        }

        //บันทึกคำตอบลงฐานข้อมูล
        const newResponse = await prisma.response.create({
            data: {
                formID,
                userID,
                email,
                answer: JSON.stringify(answer) //เก็บคำตอบเป็น JSON
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
