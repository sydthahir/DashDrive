const User = require("../../models/userSchema");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const env = require("dotenv").config();
const nodemailer = require("nodemailer");


//Load Page-not-found page
const pageNotFound = async (req, res) => {
  try {

    res.render("page-404")
  } catch (error) {
    res.redirect("/pageNotFound")

  }

}


//Generation of otp email verification
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

//Sending of verication email with nodemailer
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


//Load Signup page
const loadSignup = async (req, res) => {
  try {
    return res.render("signup");
  } catch (error) {
    console.log("Signup page is not found");
    res.status(500).send("Server Error");
  }
};

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
      return res.render("signup", { message: "User with these email already exists" });
    } else {
      var otp = generateOTP();
    }



    const emailSend = await sendverifyEmail(email, otp);
    if (!emailSend) {
      return res.json("Error while sending email");
    }
    const hashedPassword = await securePassword(password);


    const payload = {
      name,
      email,
      hashedPassword,
      otp,
    };

    // Sign the JWT
    const token = jwt.sign(payload, process.env.JWT_SECRET);

    // Render OTP verification page with the token
    res.render("verify-otp", { token });
    console.log("OTP sent successfully", otp);
  } catch (error) {
    console.error("Error while creating user", error);
    res.redirect("/pageNotFound");
  }
};


//Password hashing
const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.error("Error hashing password:", error);
    throw error;
  }
};



//Verification of OTP
const verifyOTP = async (req, res) => {

  const token = req.body?.token;
  const otp = req.body?.otp;
  try {


    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token is missing",
      });
    }
    console.log("Entered OTP:", otp);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);




    if (decoded.otp !== String(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    const { name, email, hashedPassword } = decoded;

    const newUser = new User({
      name: name,
      email: email,
      password: hashedPassword,
    });


    if (req.body.phone && req.body.phone.trim() !== "") {
      newUser.phone = req.body.phone;
    }


    await newUser.save();
    console.log("New User created");



    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("Error verifying OTP", error);
    res.status(400).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};


//Otp resending
const resendOTP = async (req, res) => {
  try {


    const { token } = req.body;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token is missing",
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { name, email, hashedPassword } = decoded;
    const otp = generateOTP()

    const newPayload = {
      name,
      email,
      hashedPassword,
      otp,
    }

    const newToken = jwt.sign(newPayload, process.env.JWT_SECRET);


    const emailSend = await sendverifyEmail(email, otp)

    if (emailSend) {
      console.log("Resend otp:", otp);
      res.status(200).json({ success: true, message: "OTP Resend Successfully", token: newToken, })

    } else {
      res.status(500).json({ success: false, message: "Failed to resend OTP, Please Try Again" })
    }

  } catch (error) {

    console.error("Error while resending OTP", error)
    res.status(500).json({ success: false, message: "Internal Server Error. Please try again.." })
  }
}

//loading of Login page 
const loadLogin = async (req, res) => {
  try {
    return res.render("login");
  } catch (error) {
    console.log("login page is not found");
    res.status(500).send("Server Error");
  }
};


//Login 
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
    res.render("login", { message: "Login failed , Please try again" })

  }

}


//Load homepage
const loadHomepage = async (req, res) => {
  try {
    return res.render("landingPage");

  } catch (error) {
    console.log("page not found");
    res.status(500).send("Server error");
  }
};


//Loading of profile page
const profile = async (req, res) => {
  try {

    return res.render("profile")

  } catch (error) {
    console.log("Profile page not found");
    res.status(500).send("server error")

  }

}


//Loading of cars page
const loadCarsPage = async (req, res) => {
  try {
    return res.render("cars");
  } catch (error) {
    console.log("cars page not found");
    res.status(500).send("Server Error");
  }
};

module.exports = {
  loadHomepage,
  loadSignup,
  signup,
  loadLogin,
  verifyOTP,
  resendOTP,
  pageNotFound,
  login,
  loadCarsPage,
  profile

};
