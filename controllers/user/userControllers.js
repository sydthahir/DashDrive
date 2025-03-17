const User = require("../../models/userSchema");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const env = require("dotenv").config();
const nodemailer = require("nodemailer");



const pageNotFound = async (req, res) => {
  try {

    res.render("page-404")
  } catch (error) {
    res.redirect("/pageNotFound")

  }

}

const loadHomepage = async (req, res) => {
  try {
    return res.render("home");
    console.log("home page loaded");
  } catch (error) {
    console.log("Home page not found");
    res.status(500).send("Server error");
  }
};

const loadSignup = async (req, res) => {
  try {
    return res.render("signup");
  } catch (error) {
    console.log("signup page is not found");
    res.status(500).send("Server Error");
  }
};

function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

async function sendverifyEmail(email, otp) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: "Email Verification for Your Account",
      text: `Your OTP is ${otp}`,
      html: `<b>Your OTP : ${otp}</b>`,
    });

    return info.accepted.length > 0;
  } catch (error) {
    console.error("Error while sending email", error);
    return false;
  }
}

//User registration

const signup = async (req, res) => {
  try {
    const { name, email, password, confirm_password } = req.body;

    if (password !== confirm_password) {
      return res.render("signup", { message: "Password does not match" });
    }

    const findUser = await User.findOne({ email });
    if (findUser) {
      console.log("user exists");
      return res.render("signup", { message: "User already exists" });
    }

    const otp = generateOTP();

    const emailSend = await sendverifyEmail(email, otp);

    if (!emailSend) {
      return res.json("Error while sending email");
    }

    req.session.userOtp = otp;
    req.session.userData = { email, password };

    res.render("verify-otp");
    console.log("OTP sent successfully", otp);
  } catch (error) {
    console.error("Error while creating user", error);
    res.redirect("/pageNotFound");
  }
};

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) { }
};

const verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    console.log(otp);

    if (otp === req.session.userOtp) {
      const user = req.session.userData;
      const passwordHash = await securePassword(user.password);

      const newUser = new User({
        name: user.name,
        email: user.email,
        password: passwordHash,
      });
      console.log(newUser);

      await newUser.save();

      req.session.user = newUser._id;

      const token = jwt.sign(
        { userId: newUser._id, email: newUser.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      req.session.destroy();

      return res.json({ success: true, redirectUrl: "/login" });
      console.log("all set");
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid OTP,Try again" });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const resendOTP = async (req, res) => {
  try {


    if (!req.session.userData || !req.session.userData.email) {

      return res.status(400).json({
        success: false,
        message: "Session expired or invalid. Please sign up again.",
      });
    }

    const { email } = req.session.userData
    const otp = generateOTP()
    req.session.userOtp = otp


    const emailSend = await sendverifyEmail(email, otp)

    if (emailSend) {
      console.log("Resend otp:", otp);
      res.status(200).json({ success: true, message: "OTP Resend Successfully" })

    } else {
      res.status(500).json({ success: false, message: "Failed to resend OTP, Please Try Again" })
    }

  } catch (error) {

    console.error("Error while resending OTP", error)
    res.status(500).json({ success: false, message: "Internal Server Error. Please try again.." })
  }
}

const loadLogin = async (req, res) => {
  try {
    return res.render("login");
  } catch (error) {
    console.log("login page is not found");
    res.status(500).send("Server Error");
  }
};

const login = async (req, res) => {

  try {
    const { email, password } = req.body

    const findUser = await User.findOne({ isAdmin: 0, email: email })

    if (!findUser) {
      return res.render("login", { message: "User not found" })
    }
    if (findUser.isBlocked) {
      res.render("login", { message: "User is blocked by admin" })
    }

    const passwordMatch = await bcrypt.compare(password, findUser.password)

    if (!passwordMatch) {
      return res.render("login", { message: "Incorrect Password" })
    }


    const token = jwt.sign(
      { userId: findUser._id, email: findUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );


    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600000,
    })

    res.redirect("/")

  } catch (error) {

    console.error("login error", error);
    res.render("login", { message: "Login failed , Please try again"  })

  }

}

module.exports = {
  loadHomepage,
  loadSignup,
  signup,
  loadLogin,
  verifyOTP,
  resendOTP,
  pageNotFound,
  login

};
