const express = require("express");
const prisma = require("../prisma");
const checkAuth = require("../middleware/checkAuth");
const router = express.Router();

router.post("/create", checkAuth, async (req, res) => {
  console.log("Received Data:", req.body); 
  console.log("Received Data:", JSON.stringify(req.body, null, 2));
  
  const { title, description, theme, color ,limitForm, questions,} = req.body;
  const userID = req.user.id || null;
  

  const formattedQuestions = Array.isArray(questions?.create) 
  ? questions.create.filter((q) => q.title && q.title.trim() !== "") 
  : [];
  const archive = req.body.archive ?? false;

  if (questions.create.length === 0) {
    return res.status(400).json({ error: "At least one question with a title is required" });
  }

  try {
    const newForm = await prisma.form.create({
      data: {
        title,
        description,
        theme,
        color: JSON.parse(JSON.stringify(color)),
        userID,
        limitForm,
        archive,
        questions: {
          create: formattedQuestions.map(q => ({
            questionID:q.questionID,
            title: q.title,
            type: q.type,
            required: q.required,
            limit: q.limit ?? 100,
            options: q.options?.create?.length > 0
              ? { create: q.options.create.map(opt => ({ text: opt.text,
                limitAns: opt.limitAns ?? 1

               })) }
              : undefined,
          })),
        },
      },
    });
    
    console.log('ques',)
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
      select: { id: true, title: true, description: true, archive: true, createdAt: true },
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
            archive: form.archive,
            createdAt: form.createdAt,
            questions: form.questions.map(q => ({
                  title: q.title,
                  type: q.type,
                  required: q.required,
                  limit: q.limit ?? 100,
                  options: q.options.map(opt => ({
                        id: opt.id,
                        text: opt.text,
                        limitAns: opt.limitAns ?? 1
                      })) 
                    }))
            });

    } catch (err) {
        console.error("❌ Error fetching form:", err);
        res.status(500).json({ error: "Cannot fetch form data" });
    }
});



  






module.exports = router;