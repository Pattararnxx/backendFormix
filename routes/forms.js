const router = require("express").Router();
const JWT = require("jsonwebtoken");
const connection = require("../db");
const checkAuth = require("../middleware/checkAuth");

router.post('/', async (req, res) => {
    const { title,type, require} = req.body;

})

module.exports = router