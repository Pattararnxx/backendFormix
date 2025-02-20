const router = require("express").Router();
const checkAuth = require("../middleware/checkAuth");

router.get('/public', (req, res) => {
  const publicPosts = [
    { id: 1, title: "Public Post 1", content: "This is a public post" },
    { id: 2, title: "Public Post 2", content: "This is another public post" },
  ];
  res.json(publicPosts); 
});

router.get('/private', checkAuth, (req, res) => {
  const userId = req.user.id;

  connection.query('SELECT * FROM posts WHERE user_id = ?', [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ msg: "Database error", error: err });
    }

    if (results.length === 0) {
      return res.status(404).json({ msg: "No private posts found" });
    }

    res.json({
      user: req.userDetails,  // ข้อมูลผู้ใช้จากฐานข้อมูล
      posts: results,         
    });
  });
});

module.exports = router
