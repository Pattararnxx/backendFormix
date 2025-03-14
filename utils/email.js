require('dotenv').config();

const nodemailer = require('nodemailer');

const sendEmail = async(option) => {
    try {
    //CREATE A TRANSPROTER
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    })
    transporter.verify((error, success) => {
        if (error) {
            console.error("SMTP connection error:", error);
        } else {
            console.log("SMTP server is ready to take our messages");
        }
    });

    //DEFINE EMAIL OPTIONS
    const emailOptions = {
        from: `"FORMIX" <${process.env.EMAIL_USER}>`,
        to: option.email,
        subject: option.subject,
        html: `<p>${option.message}</p>`,
    }

    await transporter.sendMail(emailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

module.exports = sendEmail;
