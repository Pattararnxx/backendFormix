const express = require("express");
const cors = require("cors");
const prisma = require("./prisma");
const connection = require("./db"); 
const mysql = require('mysql2');
const myMiddleware = require('./middleware/checkAuth')

const auth = require("./routes/auth");
const post = require("./routes/post");
const form = require("./routes/form");
const response = require("./routes/response");
const app = express();

app.use(express.json());
app.use(cors({
    origin: "http://localhost:3000", 
    credentials: true
}));
app.use("/auth", auth);
app.use("/posts", post);
app.use("/form", form);
app.use("/response", response);
app.use(myMiddleware);


//Check mySQL connection
connection.connect((err, connection) => {
    if(err) {
        console.log('Error connecting to MySQL database = ', err);
        process.exit(1);
    }
    console.log('MySQL successfully connected!');
})

// app.post("/sign")

app.listen(5001, () => {
    console.log("Now running on port 5001")
})


process.on("SIGINT", async () => {
    await prisma.$disconnect(); // ✅ ปิด Prisma ก่อนปิดเซิร์ฟเวอร์
    console.log("🔴 Prisma Client disconnected");
    process.exit(0);
});


module.exports = connection;