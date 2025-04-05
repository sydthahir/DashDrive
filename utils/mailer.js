const nodemailer = require("nodemailer");




const transporter = nodemailer.createTransport({
    service: "Gmail",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
    },
});

const sendOtpMail = async (email, otp) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: "Email Verification for Your Account",
            text: `Your OTP is ${otp}`,
            html: `<b>Your OTP: ${otp}</b>`,
        });

        return info.accepted.length > 0;
    } catch (err) {
        console.error("Error sending email:", err);
        return false;
    }
};




module.exports = sendOtpMail;