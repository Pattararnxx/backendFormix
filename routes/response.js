const express = require("express");
const prisma = require("../prisma");
const router = express.Router();

router.post("/submit", async (req, res) => {
    try {
        const { formID, email, answer } = req.body;

        // เพิ่ม logging เพื่อตรวจสอบข้อมูลที่ได้รับ
        console.log("Received data:", { formID, email, answerCount: answer?.length });
        console.log("Answer details:", JSON.stringify(answer));

        // ตรวจสอบว่ามี formID และ answer หรือไม่
        if (!formID || !answer || answer.length === 0) {
            console.log("Error: Form ID and answers are required.");
            return res.status(400).json({ error: "Form ID and answers are required." });
        }

        // ตรวจสอบว่า formID มีอยู่ในฐานข้อมูลหรือไม่
        const formExists = await prisma.form.findUnique({
            where: { id: formID }
        });
        if (!formExists) {
            console.log(`Error: Form ID ${formID} not found.`);
            return res.status(404).json({ error: "Form not found." });
        }

        // ดึงข้อมูลคำถามทั้งหมดใน form
        const questionList = await prisma.question.findMany({
            where: { formID },
            select: {
                questionID: true,
                type: true,
                required: true,
                options: {
                    select: {
                        id: true,
                        text: true,
                        limitAns: true
                    }
                }
            }
        });
        
        console.log("Questions from database:", questionList.map(q => ({ id: q.questionID, type: q.type })));
        
        // ตรวจสอบคำตอบที่ส่งมา
        for (let ans of answer) {
            // ค้นหาคำถามที่ตรงกับ questionID
            const question = questionList.find(q => q.questionID === ans.questionID);
            if (!question) {
                console.log(`Error: Question ID ${ans.questionID} not found in the form.`);
                return res.status(400).json({ error: `Question ID: ${ans.questionID} not found in the form.` });
            }

            console.log(`Validating answer for question ${ans.questionID}, type: ${question.type}`);

            // แก้ไขให้รองรับประเภทคำถามที่ตรงกับหน้า frontend
            if (["mutiple", "check", "dropdown"].includes(question.type)) {
                if (!Array.isArray(ans.value)) {
                    console.log(`Error: Question ${ans.questionID} requires array values`);
                    return res.status(400).json({ error: `Question ID: ${question.questionID} requires an array of answers.` });
                }
                
                // ตรวจสอบ limitAns เฉพาะเมื่อมีการกำหนดค่าและไม่เป็น null
                const optionWithLimit = question.options.find(opt => opt.limitAns !== null);
                if (optionWithLimit && optionWithLimit.limitAns && ans.value.length > optionWithLimit.limitAns) {
                    console.log(`Error: Question ${ans.questionID} exceeds answer limit`);
                    return res.status(400).json({ 
                        error: `Question ID: ${question.questionID} allows only ${optionWithLimit.limitAns} answers.` 
                    });
                }
            }

            // ตรวจสอบคำตอบสำหรับ Text Input และ Number
            if ((question.type === "text" || question.type === "number") && 
                (typeof ans.value[0] !== "string" || !ans.value[0])) {
                if (question.required) {
                    console.log(`Error: Required question ${ans.questionID} missing answer`);
                    return res.status(400).json({ 
                        error: `Question ID: ${question.questionID} requires an answer.` 
                    });
                }
            }
            
            // ตรวจสอบคำตอบสำหรับ Radio
            if (question.type === "radio" && (!ans.value || !ans.value[0])) {
                if (question.required) {
                    console.log(`Error: Required radio question ${ans.questionID} missing answer`);
                    return res.status(400).json({ 
                        error: `Question ID: ${question.questionID} requires a selection.` 
                    });
                }
            }
        }

        console.log("All validations passed, saving response to database");
        console.log("formID:", formID);
        console.log("email:", email);
        console.log("answer:", JSON.stringify(answer));

        // บันทึกคำตอบลงฐานข้อมูล
        const newResponse = await prisma.response.create({
            data: {
                formID,
                email,
                answer: JSON.stringify(answer)
            }
        });

        console.log("Response saved successfully with ID:", newResponse.id);
        res.json({ 
            message: "Response submitted successfully!", 
            responseID: newResponse.id 
        });
    } catch (err) {
        console.error("Error submitting response:", err);
        res.status(500).json({ error: "Cannot submit response. " + err.message });
    }
});


//



module.exports = router;
