const router = require("express").Router();
const { check, validationResult } = require("express-validator");
// const users = require("../db");
const { users } = require("../db");
const sendEmail = require('../utils/email');
const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");

router.post('/signup',[
    check("email","Please provide a valid email")
        .isEmail(),
    check("password", "Please provide a password that is greater than 5 charaters, contain an uppercase letter, and a special character")
    .isLength({
        min: 6
    })
    .matches(/^(?=.*[A-Z])(?=.*[!@#$%^&*])/),
    check("confirmPassword", "Please confirm your password").not().isEmpty()
], async (req,res) => {
    const { password, confirmPassword, email } = req.body;

    // VALIDATED THE INPUT
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({
            errors: errors.array()
        })
    }

    // VERIFY THAT PASSWORD AND CONFIRMATION MATCH
    if (password !== confirmPassword) {
        return res.status(400).json({
            "error": [{ "msg": "Passwords do not match"}]
        });
    }
    // VALIDATE IF USER DOESN'T ALREADY EXIST

    //users().find((user) =>)
    let user = users.find((user) =>{
        return user.email === email
    });

    if(user){
        return res.status(400).json({
            "errors": [
                {
                    "msg": "This user already exists",
                }
            ]
        })
    }
    
    const hashedPassword = await bcrypt.hash(password, 10)
    // user().push
    users.push({
        email,
        password: hashedPassword
    })

    const token = await JWT.sign({
        email
    }, "dkjsfahbewaoiuffadf65fds97fdsh",{
        expiresIn: 36000000
    })
    res.json({
        token
    })
})

router.post('/login', async (req, res) =>{
    const { password, email} = req.body;

    // const user = (await users.users()).find((user) => {
    //     return user.email === email;
    // })
    let user = users.find((user) => {
        return user.email === email;
    })

    if(!user){
        return res.status(400).json({
            "errors": [
                {
                    "msg": "Invalid Credentials",
                }
            ]
        })
    };

    let isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch){
        return res.status(400).json({
            "errors": [
                {
                    "msg": "Invalid Credentials",
                }
            ]
        })
    };

    const token = await JWT.sign({
        email
    }, "dkjsfahbewaoiuffadf65fds97fdsh",{
        expiresIn: 3600000
    })
    res.json({
        token
    })

})

router.post('/forgot-password',async(req,res,next) =>{
    const { email } = req.body;
    
    let user = users.find((user) =>{
        return user.email === email
    });

    if (!user) {
        return res.status(400).json({ msg: "Email not found"});
    }
    const resetToken = await JWT.sign({ 
            email 
        }, "faldgjewiasdnkvldhvaeiwrO",{ 
            expiresIn: "30m"
        });
    const resetLink = `http://formix.com/reset-password/${resetToken}`;
    
    try {
        await sendEmail({
            email: email,
            subject: "Password Reset Request",
            message: `Click the link below to reset your password:\n\n${resetLink}`
        });
    
        res.status(200).json({
            status: 'success',
            message: 'Password reset link sent to the user email'
        });
    } catch (error) {
        console.error("Email sending error:", error);  // แสดงข้อผิดพลาดที่เกิดขึ้น
    
        return res.status(500).json({ msg: "Failed to send password reset email" });
    }
     
    res.json({ msg: "Password reset link has been sent to your email." });
})

router.post('/reset-password/:token',async(req, res)=>{
    const { token } = req.params;
    const { newPassword } = req.body;

    try {
        // CHECK TOKEN
        const decoded =  JWT.verify(token, "faldgjewiasdnkvldhvaeiwrO");

        // FIND EMAIL IN TOKEN
        const user = users.find(user => user.email === decoded.email);
        if (!user) {
            return res.status(400).json({msg: "Invalid token"});
        }

        // UPDATE RESET PASSWORD
        const hashedPassword = await bcrypt.hash(newPassword,10);
        user.password = hashedPassword;

        res.json({ msg: "Password has been reset successfully"});
    } catch (error) {
        res.status(400).json({ msg: "Invalid or expired token" })
    }
})

router.get("/all",(req,res)=>{
    res.json(users);
})

module.exports = router