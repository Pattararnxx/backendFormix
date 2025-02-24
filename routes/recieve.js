const express = require("express");
const prisma = require("../prisma");
const router = express.Router();

router.get("/public/:formID", async (req, res) => {
    try {
        const { formID } = req.params;
  
        const form = await prisma.form.findUnique({
            where: { id: formID },
            include: {
                questions: {
                    include: { options: true }
                }
            }
        });
        
       
  
        const color = form.color ? JSON.parse(JSON.stringify(form.color)) : null;
        const data = {
            formID: form.id,
            title: form.title,
            description: form.description,
            theme: form.theme,
            color: color,
            questions: form.questions.map(q => ({
                id:q.questionID,
                title: q.title,
                type: q.type,
                required: q.required,
                limit: q.limit ??null,
                limitAns: q.limitAns ?? 1,
                options: q.options.length!==0? q.options.map(opt => ({
                      id: opt.id,
                      text: opt.text }))
            :null}))
        }
        res.json(data);
  
    } catch (err) {
        console.error("❌ Error fetching form:", err);
        res.status(500).json({ error: "Cannot fetch form data" });
    }
  });


  
//รับคำตอบของผู้ใช้
router.post("/:formID/submit", async (req, res) => {
    try {
        const { formID } = req.params;
        const { email, answers } = req.body; // รับ `email` และ `answers` จาก frontend

        if (!formID || !answers || answers.length === 0) {
            return res.status(400).json({ error: "Form ID and answers are required." });
        }

        // ตรวจสอบว่า `formID` มีอยู่จริง
        const formExists = await prisma.form.findUnique({
            where: { id: formID }
        });

        if (!formExists) {
            return res.status(404).json({ error: "Form not found." });
        }

        // ดึงข้อมูลคำถามทั้งหมดของแบบฟอร์ม
        const questionList = await prisma.question.findMany({
            where: { formID },
            select: { id: true, type: true, limitAns: true }
        });

        // ตรวจสอบคำตอบที่ส่งมา
        for (let ans of answers) {
            const question = questionList.find(q => q.id === ans.questionID);

            if (!question) {
                return res.status(400).json({ error: `Invalid question ID: ${ans.questionID}` });
            }

            // ตรวจสอบคำตอบสำหรับ Multiple Choice หรือ Dropdown
            if (["multiple-choice", "dropdown"].includes(question.type)) {
                if (!Array.isArray(ans.value)) {
                    return res.status(400).json({ error: `Question ID: ${question.id} requires an array of answers.` });
                }
                if (ans.value.length > question.limitAns) {
                    return res.status(400).json({ error: `Question ID: ${question.id} allows only ${question.limitAns} answers.` });
                }
            }

            // ตรวจสอบคำตอบสำหรับ Text Input
            if (question.type === "text" && typeof ans.value !== "string") {
                return res.status(400).json({ error: `Question ID: ${question.id} requires a text answer.` });
            }
        }

        // บันทึกคำตอบลงฐานข้อมูล (ไม่มี userID)
        const newResponse = await prisma.response.create({
            data: {
                formID,
                email: email || "guest", // ถ้าไม่มี email ให้กำหนดเป็น "guest"
                answer: answers, // ✅ Prisma ใช้ Json โดยตรง
                createdAt: new Date() // บันทึกเวลาที่ตอบแบบฟอร์ม
            }
        });

        res.json({ message: "Response submitted successfully!", responseID: newResponse.id });
    } catch (err) {
        console.error("❌ Error submitting response:", err);
        res.status(500).json({ error: "Cannot submit response" });
    }
});
  module.exports = router;