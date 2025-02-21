const express = require("express");
const prisma = require("../prisma");
const checkAuth = require("../middleware/checkAuth");
const router = express.Router();

router.get("/", checkAuth, async (req, res) => {
  const userID = req.userID;
  if (!userID) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const form = await prisma.user.findUnique({
      where: { id: userID },
    });

    if (!form) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ totalForm: form.length });
    console.log(form);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
