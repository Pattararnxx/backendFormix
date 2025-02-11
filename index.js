const express = require("express");
const cors = require("cors");
const auth = require("./routes/auth");
const post = require("./routes/post");
const forms = require("./routes/forms");
const app = express();
const mysql = require('mysql2');
const connection = require("./db"); // ✅ Import db.js instead of defining connection in index.js

app.use(cors());
// app.use(cors({ origin: "http://localhost:8889", credentials: true }));
app.use(express.json());
app.use("/auth", auth);
app.use("/posts", post);
app.use("/forms", forms);

//Check mySQL connection
connection.connect((err, connection) => {
    if(err) {
        console.log('Error connecting to MySQL database = ', err);
        return;
    }
    console.log('MySQL successfully connected!');
})

// app.post("/sign")

app.listen(5001, () => {
    console.log("Now running on port 5001")
})

module.exports = connection;