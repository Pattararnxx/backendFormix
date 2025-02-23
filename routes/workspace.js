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
      select: { email: true ,name:true},
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
        active: true,
      },
    });

    if (forms.length === 0) {
      return res.status(404).json({ error: "No forms found" });
    }

    const totalForm = forms.length;
    const activeForm = forms.filter((form) => form.active).length;

    const formattedForms = forms.map((form) => ({
      name: form.title,
      archive: !form.active,
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

      // 🔍 ตรวจสอบว่าผู้ใช้มีอยู่จริง
      const existingUser = await prisma.user.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingUser) {
        return res.status(404).json({ err: "User not found" });
      }

      // 🔄 อัปเดตเฉพาะ `name`
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

module.exports = router;
