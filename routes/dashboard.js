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
        const activeForms = forms.filter((form) => form.archive).length;
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

        const responseData = form.responses.map((resp) => {
            const seenAnswers = new Set(); // Set สำหรับกรองคำตอบซ้ำ

            // แปลง JSON ของคำตอบและกรองซ้ำ
            const filteredAnswers = JSON.parse(resp.answer).filter((ans) => {
                const key = ans.questionID + ans.value; // สร้าง key จาก questionID และ value
                if (seenAnswers.has(key)) return false; // ถ้ามีคำตอบซ้ำ ให้ตัดออก
                seenAnswers.add(key); // เพิ่มคำตอบใหม่เข้า Set
                return true;
            });

            return {
                id: resp.id,
                email: resp.email || "Anonymous",
                createdAt: resp.createdAt,
                answers: filteredAnswers.map((ans) => {
                    // แทนที่จะใช้การค้นหาแบบตรงๆ จะใช้การจับคู่บางส่วนหรือ `questionID`
                    const question = form.questions.find((q) => q.questionID === ans.questionID); 
                    if (!question) {
                        console.warn(`No match found for questionID: ${ans.questionID}`);
                    }

                    return {
                        questionID: ans.questionID,
                        value: ans.value,
                        questionTitle: question ? question.title : "Unknown",
                    };
                }),
            };
        });

        res.json({
            formID: form.id,
            title: form.title,
            responses: responseData,
        });
    } catch (err) {
        console.error("Error fetching responses:", err);
        res.status(500).json({ error: "Failed to fetch response data" });
    }
});

router.get("/form/:formID/graph", checkAuth, async (req, res) => {
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

        const answerCountMap = new Map();


        form.responses.forEach((resp) => {
            const answers = JSON.parse(resp.answer);

            answers.forEach((ans) => {
                const key = ans.value; 
                if (answerCountMap.has(key)) {
                    answerCountMap.set(key, answerCountMap.get(key) + 1);
                } else {
                    answerCountMap.set(key, 1);
                }
            });
        });

        const categorizedData = new Map();

        form.questions.forEach((question) => {
            form.responses.forEach((resp) => {
                const answers = JSON.parse(resp.answer);

                answers.forEach((ans) => {
                    if (ans.questionID === question.questionID) {
                        const category = question.title; 
                        if (!categorizedData.has(category)) {
                            categorizedData.set(category, []);
                        }
                        categorizedData.get(category).push({
                            name: ans.value,
                            value: answerCountMap.get(ans.value) || 0,
                        });
                    }
                });
            });
        });

        const setData = Array.from(categorizedData.values());

        res.json({
            formID: form.id,
            title: form.title,
            setData,
        });
    } catch (err) {
        console.error("Error fetching responses:", err);
        res.status(500).json({ error: "Failed to fetch response data" });
    }
});



router.get("/form/:formID/export", checkAuth, async (req, res) => {
    try {
        const { formID } = req.params;

        const form = await prisma.form.findUnique({
            where: { id: formID },
            include: {
                questions: true,
                responses: true
            },
        });

        if (!form) {
            return res.status(404).json({ error: "Form not found." });
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Responses");

        // สร้างคอลัมน์ของ Excel
        const columns = [
            { header: "Response ID", key: "id", width: 12 },
            { header: "Email", key: "email", width: 25 },
            { header: "Submitted At", key: "createdAt", width: 20 },
        ];

        form.questions.forEach((question) => {
            columns.push({
                header: question.title,
                key: `q${question.id}`,
                width: 30,
            });
        });

        worksheet.columns = columns;

        // ปรับแต่งสีของแถวหัวข้อ (Header Row)
        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true };
            cell.alignment = { horizontal: 'center' };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'DCE775' }, // สีพื้นหลังเขียวอ่อน
            };
        });

        // เพิ่มข้อมูลของคำตอบ
        form.responses.forEach((resp, idx) => {
            let answers = [];

            try {
                const fixedAnswer = resp.answer.replace(/\s*"\w+ e"\s*:/g, '"value":');
                answers = JSON.parse(fixedAnswer);
            } catch (err) {
                console.error("Error parsing response answer:", err);
                answers = [];
            }

            const answerMap = new Map();

            answers.forEach(({ questionID, value }) => {
                if (!Array.isArray(value)) return;
                const qID = Number(questionID);
                if (!answerMap.has(qID)) {
                    answerMap.set(qID, new Set());
                }
                value.forEach((v) => answerMap.get(qID).add(v));
            });
            const createdAtThai = new Date(resp.createdAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
            const rowData = {
                id: `${idx + 1}`,
                email: resp.email || "Anonymous",
                createdAt: createdAtThai,
            };

            form.questions.forEach((question) => {
                const uniqueAnswers = answerMap.has(question.questionID)
                    ? [...answerMap.get(question.questionID)].join(" / ")
                    : "N/A";
                rowData[`q${question.id}`] = uniqueAnswers;
            });

            const row = worksheet.addRow(rowData);

            // เพิ่มสีพื้นหลังที่นุ่มนวลให้กับแถว
            row.eachCell((cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'F1F8E9' }, // สีเขียวอ่อน
                };
                cell.alignment = { horizontal: 'center' };
            });
        });

        // ตั้งค่า response header สำหรับการดาวน์โหลดไฟล์ Excel
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

