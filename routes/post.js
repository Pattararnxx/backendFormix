const router = require("express").Router();
const prisma = require("../prisma");
const checkAuth = require("../middleware/checkAuth");

router.get("/public", (req, res) => {
  const publicPosts = [
    { id: 1, title: "Public Post 1", content: "This is a public post" },
    { id: 2, title: "Public Post 2", content: "This is another public post" },
  ];
  res.json(publicPosts);
});

router.get("/private", checkAuth, async (req, res) => {
  try {
    const userId = req.user.id; 
    const forms = await prisma.form.findMany({
      where: { userID: userId }, 
    });

    if (!forms || forms.length === 0) {
      return res.status(404).json({ msg: "No private posts found" });
    }

    res.json({
      user: req.userDetails,
      forms: forms,  
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ msg: "Database error", error: error.message });
  }
});


module.exports = router;
