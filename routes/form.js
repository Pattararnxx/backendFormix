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
        color,
        userID,
        limitForm,
        questions:{
          create: formattedQuestions.map(q => ({
            title: q.title,
            type: q.type,
            required: q.required,
            limit: q.limit,
            limitAns: q.limitAns
            }))
          }
        }
      });
      return res.json({ msg: "Form created successfully", form: newForm });
  } catch (err) {
    console.error("❌ Error creating form:", err);
    return res.status(500).json({ msg: "Failed to create form", error: err });
  }
});

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
router.put("/:id", checkAuth, async (req, res) => {
  const { id } = req.params;
  
  try {

    if (!userID) {
      return res.status(401).json({ error: "Unauthorized: No user ID found" });
    }

    const form = await prisma.form.findUnique({ where: { id: String(id) } });

    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    if (form.userID !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized to edit this form" });
    }

    const updatedForm = await prisma.form.update({
      where: { id: id },
      data: {
        title,
        description,
        color,
        theme,
        userID,
      },
    });

    res.json({ msg: "Updated form successfully!", updatedForm });
  } catch (err) {
    console.error("❌ Error updating form:", err);
    res.status(400).json({ error: "Failed to update form" });
  }
});

// // Delete form
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
