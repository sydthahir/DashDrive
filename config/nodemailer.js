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


module.exports = transporter