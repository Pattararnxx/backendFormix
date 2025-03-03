const express = require("express");
const prisma = require("../prisma");
const checkAuth = require("../middleware/checkAuth");
const { check, validationResult } = require("express-validator");
const router = express.Router();

router.get("/getForm", checkAuth, async (req, res) => {
  try {
    const userID = req.user?.id;
    if (!userID) {
      return res.status(401).json({ error: "Unauthorized: No userID" });
    }

    // ดึงข้อมูล email ของผู้ใช้
    const user = await prisma.user.findUnique({
      where: { id: userID },
      select: { email: true, name: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // ดึงข้อมูลฟอร์มทั้งหมดของผู้ใช้
    const forms = await prisma.form.findMany({
      where: { userID: userID },
      select: {
        id: true,
        title: true,
        theme: true,
        archive : true,
      },
    });
    if (forms.length === 0) {
      console.log("email", user.email);
      return res.status(200).json({
        userID,
        activeForm: 0,
        totalForm: 0,
        email: user.email,
        name: user.name || "USER NAME",
        error: "No forms found",
      });
    } else {
      const totalForm = forms.length;
      const activeForm = forms.filter((form) => form.archive).length;

      const formattedForms = forms.map((form) => ({
        id: form.id,
        name: form.title,
        archive: form.archive ,
        proflieId: form.theme,
        status: false,
      }));

      res.json({
        userID,
        totalForm,
        activeForm,
        email: user.email,
        name: user.name || "USER NAME",
        forms: formattedForms,
      });
    }
  } catch (error) {
    console.error("❌ Error fetching forms:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put(
  "/:id",
  checkAuth,
  [check("name", "Name is required").not().isEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name } = req.body;

    try {
      // ❌ ป้องกันไม่ให้ผู้ใช้แก้ไขชื่อของคนอื่น
      if (parseInt(id) !== req.user.id) {
        return res
          .status(403)
          .json({ err: "Unauthorized access to change name" });
      }

      const existingUser = await prisma.user.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingUser) {
        return res.status(404).json({ err: "User not found" });
      }

      const updatedUser = await prisma.user.update({
        where: { id: parseInt(id) },
        data: { name },
        select: { id: true, name: true },
      });

      res.json({
        msg: "User name updated successfully",
        userID: updatedUser.id,
        user: updatedUser,
      });
    } catch (error) {
      console.error("❌ Error updating user name:", error);
      res.status(500).json({ err: "Server error" });
    }
  }
);

router.delete("/:id", checkAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userID = req.user.id || null;

    if (!userID) {
      return res.status(401).json({ error: "Unauthorized: No user ID found" });
    }

    const form = await prisma.form.findUnique({
      where: { id: String(id) },
    });
    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    if (form.userID !== userID) {
      return res
        .status(403)
        .json({ error: "Unauthorized to delete this form" });
    }

    await prisma.form.delete({
      where: { id: String(id) },
    });

    res.json({ msg: "Form deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting form:", err);
    res.status(500).json({ error: "Failed to delete form" });
  }
});

module.exports = router;
