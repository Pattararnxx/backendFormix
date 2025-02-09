const express = require("express");
const cors = require("cors");
const auth = require("./routes/auth");
const post = require("./routes/post");
const app =express();

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use("/auth", auth);
app.use("/posts", post);

app.get("/",(req,res) => {
    res.send("Hi I am working")
})

// app.post("/sign")

app.listen(5000, () => {
    console.log("Now running on port 5000")
})