const express = require("express");
const prisma = require("../prisma");
const checkAuth = require("../middleware/checkAuth");
const router = express.Router();
const ExcelJS = require("exceljs");

//API ดึงข้อมูลสถิติของฟอร์ม
router.get("/stats", checkAuth, async (req, res) => {
    try {
        const userID = req.user.id;

        //ดึงข้อมูลฟอร์มของผู้ใช้
        const forms = await prisma.form.findMany({
            where: { userID },
            include: {
                _count: { select: { responses: true } },
            },
        });

        const totalForms = forms.length;
        const activeForms = forms.filter((form) => form.active).length;
        const inactiveForms = totalForms - activeForms;
        const mostAnsweredForm = forms.reduce((prev, curr) =>
            prev._count.responses > curr._count.responses ? prev : curr, forms[0]
        );

        res.json({
            totalForms,
            activeForms,
            inactiveForms,
            mostAnsweredForm: mostAnsweredForm
                ? { id: mostAnsweredForm.id, title: mostAnsweredForm.title, responses: mostAnsweredForm._count.responses }
                : null,
        });
    } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        res.status(500).json({ error: "Failed to fetch dashboard statistics" });
    }
});

//API ดึงข้อมูลคำตอบของฟอร์ม (ใช้สร้างกราฟ)
router.get("/form/:formID/responses", checkAuth, async (req, res) => {
    try {
        const { formID } = req.params;

        const form = await prisma.form.findUnique({
            where: { id: formID },
            include: {
                questions: { include: { options: true } },
                responses: true,
            },
        });

        if (!form) {
            return res.status(404).json({ error: "Form not found." });
        }

        const responseData = form.questions.map((q) => ({
            id: q.id,
            type: q.type,
            title: q.title,
            options: q.options.map((opt) => ({
                id: opt.id,
                text: opt.text,
                count: form.responses.filter((r) =>
                    JSON.parse(r.answer).some((a) => a.questionID === q.id && a.value.includes(opt.text))
                ).length,
            })),
        }));

        res.json({ formID: form.id, title: form.title, responses: responseData });
    } catch (err) {
        console.error("Error fetching responses:", err);
        res.status(500).json({ error: "Failed to fetch response data" });
    }
});

//API Export คำตอบเป็นไฟล์ Excel
router.get("/form/:formID/export", checkAuth, async (req, res) => {
    try {
        const { formID } = req.params;

        const form = await prisma.form.findUnique({
            where: { id: formID },
            include: { responses: true },
        });

        if (!form) {
            return res.status(404).json({ error: "Form not found." });
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Responses");

        worksheet.columns = [
            { header: "Response ID", key: "id", width: 10 },
            { header: "Email", key: "email", width: 25 },
            { header: "Answers", key: "answer", width: 50 },
            { header: "Submitted At", key: "createdAt", width: 20 },
        ];

        form.responses.forEach((resp) => {
            worksheet.addRow({
                id: resp.id,
                email: resp.email,
                answer: JSON.stringify(resp.answer),
                createdAt: resp.createdAt,
            });
        });

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename=form_${formID}_responses.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error("Error exporting responses:", err);
        res.status(500).json({ error: "Failed to export response data" });
    }
});

module.exports = router;
