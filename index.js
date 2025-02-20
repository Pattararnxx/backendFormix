const express = require("express");
const cors = require("cors");
const prisma = require("./prisma");
const checkAuth = require('./middleware/checkAuth')

const auth = require("./routes/auth");
const post = require("./routes/post");
const form = require("./routes/form");
const response = require("./routes/response");
const dashboard = require("./routes/dashboard");

const app = express();

app.use(express.json());
app.use(cors({
    origin: "http://localhost:3000", 
    credentials: true
}));

app.use("/auth", auth);
app.use("/posts", post);
app.use("/form", checkAuth, form);
app.use("/response", checkAuth, response);
app.use("/dashboard", checkAuth, dashboard);


// ✅ ตรวจสอบว่า Prisma เชื่อมต่อฐานข้อมูลได้หรือไม่
app.get("/health", async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`; // ทดสอบ Query
        res.json({ status: "Database connected!" });
    } catch (error) {
        res.status(500).json({ error: "Database connection failed!" });
    }
});

//ปิดการเชื่อมต่อ Prisma
process.on("SIGINT", async () => {
    await prisma.$disconnect(); // ✅ ปิด Prisma ก่อนปิดเซิร์ฟเวอร์
    console.log("🔴 Prisma Client disconnected");
    process.exit(0);
});

app.listen(5001, () => {
    console.log("Now running on port 5001")
})
