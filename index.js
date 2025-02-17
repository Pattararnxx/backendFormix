const express = require("express");
const cors = require("cors");
const prisma = require("./prisma");
const connection = require("./db"); 
const mysql = require('mysql2');
const myMiddleware = require('./middleware')

const auth = require("./routes/auth");
const post = require("./routes/post");
const create = require("./form/create-form");
const submit = require("./form/submit-response");
const app = express();

app.use(express.json());
app.use(cors({
    origin: "http://localhost:3000", 
    credentials: true
}));
app.use(myMiddleware);
app.use("/auth", auth);
app.use("/posts", post);
app.use("/create-form", create);
app.use("/submit-response", submit);

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