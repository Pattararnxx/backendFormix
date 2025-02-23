const express = require("express");
const prisma = require("../prisma");
const checkAuth = require("../middleware/checkAuth");
const router = express.Router();

router.post("/create", checkAuth, async (req, res) => {
  console.log("Received Data:", req.body); 
  console.log("Received Data:", JSON.stringify(req.body, null, 2));
  
  const { title, description, theme, color ,limitForm, questions} = req.body;
  const userID = req.user.id || null;
  const formattedQuestions = Array.isArray(questions.create) ? questions.create : [];
  const forms = await prisma.user.findMany({
    where: { id: userID },  
  });
  console.log(forms)

  try {
    const newForm = await prisma.form.create({
      data: {
        title,
        description,
        theme,
        color: JSON.parse(JSON.stringify(color)),
        userID,
        limitForm,
        questions: {
          create: formattedQuestions.map(q => ({
            title: q.title,
            type: q.type,
            required: q.required,
            limit: q.limit ?? 100,
            limitAns: q.limitAns ?? 1,
            options: q.options?.create?.length > 0
              ? { create: q.options.create.map(opt => ({ text: opt.text })) }
              : undefined,
          })),
        },
      },
    });
    
    const createdForm = await prisma.form.findUnique({
      where: { id: newForm.id },
      include: { questions: { include: { options: true } } }
    });
    
    return res.json({ msg: "Form created successfully", form: createdForm });
  } catch (err) {
    console.error("❌ Error creating form:", err);
    return res.status(500).json({ msg: "Failed to create form", error: err });
  }
});

//แสดงทุกแบบform ของuser
router.get("/user", checkAuth, async (req, res) => {
  try {
    const forms = await prisma.form.findMany({
      where: { userID: req.user.id },
      select: { id: true, title: true, description: true, active: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ msg: "Forms retrieved successfully", forms });
  } catch (error) {
    console.error("❌ Error fetching forms:", error);
    res.status(500).json({ msg: "Server error", error });
  }
});

// Show a specific form by ID ✅
router.get("/:id", checkAuth, async (req, res) => {
  const { id } = req.params;
  
  try {

    const form = await prisma.form.findUnique({
      where: { id: String(id) },
      include: { questions: { include: { options: true } } }
    });

    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    if (form.userID !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    return res.status(200).json({ msg: "Form retrieved successfully", form });
  
  } catch (err) {
    console.error("❌ Error fetching form:", err);
    res.status(500).json({ error: "Failed to fetch form" });
  }
});

// Update form
router.get("/editor/:formID", async (req, res) => {
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

        if (!form) {
            return res.status(404).json({ error: "Form not found." });
        }

        // ✅ แปลง `color` จาก JSON (ถ้ามี)
        const color = form.color ? JSON.parse(JSON.stringify(form.color)) : null;

        // ✅ JSON ที่จะส่งไปให้ frontend
        res.json({
            formID: form.id,
            title: form.title,
            description: form.description,
            theme: form.theme,
            color: color,
            active: form.active, // ✅ เช็คว่าเปิดใช้งานฟอร์มหรือไม่
            createdAt: form.createdAt, // ✅ เวลาที่สร้างฟอร์ม
            questions: form.questions.map(q => ({
                  title: q.title,
                  type: q.type,
                  required: q.required,
                  limit: q.limit ?? 100,
                  limitAns: q.limitAns ?? 1,
                  options: q.options.map(opt => ({
                        id: opt.id,
                        text: opt.text })) 
                    }))
            });

    } catch (err) {
        console.error("❌ Error fetching form:", err);
        res.status(500).json({ error: "Cannot fetch form data" });
    }
});

//api สำหรับดูฟอร์ม
router.get("/public/:formID", async (req, res) => {
    try {
        const { formID } = req.params;

        // ✅ ดึงข้อมูลฟอร์ม พร้อม questions และ options
        const form = await prisma.form.findUnique({
            where: { id: formID },
            include: {
                questions: {
                    include: { options: true }
                }
            }
        });

        if (!form) {
            return res.status(404).json({ error: "Form not found." });
        }

        // ✅ แปลง `color` จาก JSON (ถ้ามี)
        const color = form.color ? JSON.parse(JSON.stringify(form.color)) : null;

        // ✅ JSON ที่จะส่งไปให้ frontend
        res.json({
            formID: form.id,
            title: form.title,
            description: form.description,
            theme: form.theme,
            color: color,
            questions: form.questions.map(q => ({
                title: q.title,
                type: q.type,
                required: q.required,
                limit: q.limit ?? 100,
                limitAns: q.limitAns ?? 1,
                options: q.options.map(opt => ({
                      id: opt.id,
                      text: opt.text }))
            }))
        });

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





// Delete form
// router.delete("/:id", checkAuth, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userID = req.user.id || null;

//     if (!userID) {
//       return res.status(401).json({ error: "Unauthorized: No user ID found" });
//     }

//     const form = await prisma.form.findUnique({
//       where: { id: String(id) },
//     });

//     if (!form) {
//       return res.status(404).json({ error: "Form not found" });
//     }

//     if (form.userID !== req.user.id) {
//       return res.status(403).json({ error: "Unauthorized to delete this form" });
//     }

//     await prisma.form.delete({
//       where: { id: String(id) },
//     });

//     res.json({ msg: "Form deleted successfully" });
//   } catch (err) {
//     console.error("❌ Error deleting form:", err);
//     res.status(400).json({ error: "Failed to delete form" });
//   }
// });

module.exports = router;