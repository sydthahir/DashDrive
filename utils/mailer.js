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

// 🔐 OTP MAIL
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

// VENDOR APPROVAL MAIL
const sendVendorApprovalMail = async (email, name) => {
    await transporter.sendMail({
        from: `"DashDrive" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "🎉 Vendor Account Approved - DashDrive",
        html: `
      <h2>Hello ${name},</h2>
      <p>Congratulations! Your vendor account has been <b>approved</b> by our admin.</p>
      <p>You can now log in and start listing cars on DashDrive.</p>
      <a href="https://dashdrive.com/vendor/login">
        Login to Dashboard
      </a>
      <br/><br/>
      <p>— DashDrive Team</p>
    `
    });
};




module.exports = {
    sendOtpMail,
    sendVendorApprovalMail
};