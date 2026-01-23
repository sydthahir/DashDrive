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

// OTP MAIL
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

// Vendor Approval MAIL
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

//Vendor Rejection MAIL
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

//Car Approval  MAIL
const sendCarApprovalMail = async (email, name, carBrand, carModel) => {
  if (!email) {
    throw new Error("Vendor email is missing")
  }

  await transporter.sendMail({
    from: `"DashDrive"  <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your Car Listing Has Been Approved – DashDrive",
    html: ` <p>Hello</p><h3> ${name} ,</h3>
      <p>Congratulations! We’re happy to inform you the car <strong> ${carBrand} ${carModel} </strong> that you registered on
      <strong> DashDrive </strong> has been successfully reviewed and <strong> approved </strong> by our admin team.</p>
      <p>Your car listing is now live on the <strong> DashDrive </strong> platform and visible to users for test drive bookings.</p>
      <p>You can now log in to your vendor dashboard to:</p>
   <ul>
      <li>Manage car availability and time slots.</li>
      <li>View and handle test drive bookings.</li>
      <li>Edit car details and documents if required.</li>
   </ul>

   <p>Thank you for partnering with <strong>DashDrive</strong>. We look forward to a successful collaboration.</p>

    <p>Warm regards,<br>
    <strong> Admin Team <br>
    DashDrive </strong></p>`,
  })
}

//Car Rejection MAIL
const sendCarRejectionMail = async (email, name, carBrand, carModel) => {
  if (!email) {
    throw new Error("Vendor email is missing")
  }
  await transporter.sendMail({
    from: `"DashDrive"  <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Update on Your Car Listing – DashDrive",
    html: ` <p>Hello </p><h3> ${name} ,</h3>
     <p>Thank you for registering your car on <strong> DashDrive </strong>. After carefully reviewing the submitted details and documents,
      we regret to inform you that <strong> ${carBrand} ${carModel} </strong> listing has <strong> not been approved </strong> at this time.</p>

  <p>We appreciate your cooperation and thank you for partnering with <strong> DashDrive </strong>.</p>

    <p>Kind regards,<br>
    <strong>Admin Team</strong><br>
    DashDrive</p>`,
  })
}

module.exports = {
  sendOtpMail,
  sendVendorApprovalMail,
  sendVendorRejectionMail,
  sendCarApprovalMail,
  sendCarRejectionMail,
}
