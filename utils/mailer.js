const nodemailer = require("nodemailer")

const transporter = nodemailer.createTransport({
  service: "Gmail",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD,
  },
})

// 🔐 OTP MAIL
const sendOtpMail = async (email, otp) => {
  try {
   
    const info = await transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: "Email Verification for Your Account",
      text: `Your OTP is ${otp}`,
      html: `<b>Your OTP: ${otp}</b>`,
    })

    return info.accepted.length > 0
  } catch (err) {
    console.error("Error sending email:", err)
    return false
  }
}

// VENDOR APPROVAL MAIL
const sendVendorApprovalMail = async (email, name) => {
  await transporter.sendMail({
    from: `"DashDrive" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "🎉 Vendor Account Approved - DashDrive",
    html: `
      <p>Hello, </p><h2> ${name}</h2>
      <p>Congratulations! We’re happy to inform you that your vendor account on <b>DashDrive</b> has been successfully <b>approved</b> by our admin team.</p>
      <p>You can now log in to your vendor dashboard and start managing your car listings, availability, and test drive bookings.</p>
      <a href="http://localhost:3000/vendor/login">
        Login to Dashboard
      </a>
      <br/><br/>
      <p> Warm regards,</p>
       <p>Admin Team – <b> DashDrive</b></p>
    `,
  })
}
const sendVendorRejectionMail = async (email, name) => {
  await transporter.sendMail({
    from: `"DashDrive" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Update on Your Vendor Registration – DashDrive",
    html: `
       <p>Hello, </p><h2> ${name}</h2>
      <p>Thank you for your interest in partnering with <b>DashDrive</b>. After careful review of your vendor registration details and submitted documents, 
      we regret to inform you that your application has not been approved at this time.</p>
      
       <p> Kind regards,</p>
       <p>Admin Team – <b> DashDrive</b></p>
    `,
  })
}

module.exports = {
  sendOtpMail,
  sendVendorApprovalMail,
  sendVendorRejectionMail,
}
