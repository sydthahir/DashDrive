const User = require("../../models/userSchema");
const TempUser = require('../../models/tempUserSchema')
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const env = require("dotenv").config();
const generateOTP = require('../../utils/otpGenerator');
const sendOtpMail = require('../../utils/mailer');
const { securePassword } = require('../../utils/hashPassword');
const { name } = require("ejs");


//Load Page-not-found 
const pageNotFound = async (req, res) => {
  try {
    res.status(404).render("page-404", {
      message: "Page not found",
      error: null
    });
  } catch (error) {
    console.error("Error rendering 404 page:", error);
    res.status(500).send("Internal Server Error"); // For critical errors
  }

}

//Loading of landing page

const loadLandingPage = async (req, res) => {
  try {
    return res.render("landingPage");
  } catch (error) {
    console.log("page not found");
    res.redirect("/pageNotFound");
  }

}

//Load Signup page
const loadSignup = async (req, res) => {
  try {


    return res.render("signup");
  } catch (error) {
    console.log("Signup page is not found");
    res.redirect("/pageNotFound");
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
    }
    var otp = generateOTP();





    const emailSent = await sendOtpMail(email, otp);
    if (!emailSent) {
      return res.render("signup", { message: "Error sending verification email" });
    }





    // Temporarily store registration data and OTP 
    const tempData = {
      name,
      email,
      password,
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000 // 10-minute expiration
    };




    //Checks duplicate TempUser
    const existingTempData = await TempUser.findOne({ email });
    if (existingTempData) {
      await TempUser.deleteOne({ email }); // 
    }
    await TempUser.create(tempData);




    res.render("verify-otp", { email: tempData.email, message: null });
    console.log("OTP sent successfully", otp);


  } catch (error) {
    console.error("Error while creating vendor account", error);
    res.redirect("/pageNotFound");
  }
}



//Verification of OTP
const verifyOTP = async (req, res) => {


  try {

    const { otp, email } = req.body;

    console.log("entered otp", otp);

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    // Find temporary data by email
    const tempData = await TempUser.findOne({ email });
    if (!tempData) {
      console.log("TempData not found for email:", email);
      return res.render("enter-OTP", {
        email,
        message: "Invalid or expired OTP"
      });
    }





    // OTP comparison
    if (String(tempData.otp) !== String(otp) || Date.now() > tempData.expiresAt) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }



    //Hash password
    const hashedPassword = await securePassword(tempData.password);




    //Create new user on DB
    const newUser = new User({
      name: tempData.name,
      email: tempData.email,
      password: hashedPassword,
    });

    await newUser.save();
    console.log("New User created");


    // Delete temporary data
    await TempUser.deleteOne({ email });

    //Generating JWT token
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log("jwt Token Generated")


    return res.status(200).json({
      success: true,
      message: "Account created successfully"
    });

  } catch (error) {
    console.error("Error verifying OTP:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while verifying OTP. Please try again."
    });
  }
};


//Otp resending
const resendOTP = async (req, res) => {
  try {


    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required to resend OTP"
      });
    }

    const tempData = await TempUser.findOne({ email });
    if (!tempData) {
      return res.status(400).json({
        success: false,
        message: "No pending registration found for this email",
      });
    }

    const newOTP = generateOTP();

    const emailSent = await sendOtpMail(email, newOTP);
    if (!emailSent) {
      return res.render("signup", { message: "Error sending verification email" });
    }

    tempData.otp = newOTP;
    tempData.expiresAt = Date.now() + 10 * 60 * 1000; // Reset expiration
    await tempData.save();





    console.log("OTP resent successfully:", newOTP);
    return res.status(200).json({
      success: true,
      message: "OTP resent successfully",

    });

  } catch (error) {
    console.error("Error resending OTP:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while resending OTP."
    });
  }
};

//loading of Login page 
const loadLogin = (req, res) => {
  try {

    const message = req.query.message || null;
    res.render("login", { message });


  } catch (error) {

    console.log("Login page error:", error);
    res.status(500).send("Server Error");
  }
}
  ;


//Login 
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).render("login", { message: "Email and password are required" });
    }

    const findUser = await User.findOne({ isAdmin: 0, email: email });
    if (!findUser) {
      return res.status(404).render("login", { message: "User not found" });
    }

    if (findUser.isBlocked) {
      return res.status(403).render("login", { message: "Your account is blocked" });
    }

    const passwordMatch = await bcrypt.compare(password, findUser.password);
    if (!passwordMatch) {
      return res.status(401).render("login", { message: "Incorrect Email or Password" });
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
      sameSite: "strict"
    });

    return res.redirect("/home");
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).render("login", { message: "An error occurred. Please try again." });
  }
};

// Load homepage
const loadHomepage = async (req, res) => {
  try {
    return res.render("home");
  } catch (error) {
    console.log("page not found");
    return res.status(500).send("Server error");
  }
};


//Loading of profile page
const profile = async (req, res) => {
  try {

    const user = req.user;

    if (!user) {
      console.log("User not found in database");
      return res.status(401).redirect("/login?message=Please log in to view your profile");
    }


    const wallet = { balance: user.walletBalance || 0 };
    const transactions = [];
    const totalBookings = 0;

    return res.render("profile", {
      user: {
        name: user.name || "Unknown",
        email: user.email || "N/A",
        phone: user.phone || "N/A",
        address: user.address || {
          street: "N/A",
          city: "N/A",
          state: "N/A",
          pincode: "N/A",
          country: "N/A"
        },
        memberSince: user.createdAt ? user.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "N/A"
      },
      wallet,
      transactions,
      totalBookings
    });

  } catch (error) {
    console.error("Error loading profile:", error);
    res.status(500).send("Server error")
  }
}



const editUserProfile = async (req, res) => {
  try {
    // Verify user authentication
    if (!req.user || !req.user._id) {
      console.log("No user found in req.user");
      return res.status(401).redirect("/login?message=Please log in to edit your profile");
    }

    // Log request body for debugging
    console.log("Request body:", req.body);

    // Destructure and validate input
    const { name, email, phone, address } = req.body;

    if (!name || !email || !phone || !address || !address.street || !address.city || !address.state || !address.pincode || !address.country) {
      return res.render("profile", {
        user: {
          name: req.user.name || "Unknown",
          email: req.user.email || "N/A",
          phone: req.user.phone || "N/A",
          address: req.user.address || {
            street: "N/A",
            city: "N/A",
            state: "N/A",
            pincode: "N/A",
            country: "N/A"
          },
          memberSince: req.user.createdAt ? req.user.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "N/A"
        },
        wallet: { balance: req.user.walletBalance || 0 },
        transactions: [],
        totalBookings: 0,
        message: "All fields are required"
      });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        name,
        email,
        phone,
        address: {
          street: address.street,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          country: address.country
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      console.log("User not found in database:", req.user._id);
      return res.render("profile", {
        user: {
          name: req.user.name || "Unknown",
          email: req.user.email || "N/A",
          phone: req.user.phone || "N/A",
          address: req.user.address || {
            street: "N/A",
            city: "N/A",
            state: "N/A",
            pincode: "N/A",
            country: "N/A"
          },
          memberSince: req.user.createdAt ? req.user.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "N/A"
        },
        wallet: { balance: req.user.walletBalance || 0 },
        transactions: [],
        totalBookings: 0,
        message: "User not found"
      });
    }

    // Render profile with updated data
    return res.render("profile", {
      user: {
        name: updatedUser.name || "Unknown",
        email: updatedUser.email || "N/A",
        phone: updatedUser.phone || "N/A",
        address: updatedUser.address || {
          street: "N/A",
          city: "N/A",
          state: "N/A",
          pincode: "N/A",
          country: "N/A"
        },
        memberSince: updatedUser.createdAt ? updatedUser.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "N/A"
      },
      wallet: { balance: updatedUser.walletBalance || 0 },
      transactions: [],
      totalBookings: 0,
      message: "Profile updated successfully"
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    if (error.code === 11000) { // Duplicate key error (e.g., email already exists)
      return res.render("profile", {
        user: {
          name: req.user.name || "Unknown",
          email: req.user.email || "N/A",
          phone: req.user.phone || "N/A",
          address: req.user.address || {
            street: "N/A",
            city: "N/A",
            state: "N/A",
            pincode: "N/A",
            country: "N/A"
          },
          memberSince: req.user.createdAt ? req.user.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "N/A"
        },
        wallet: { balance: req.user.walletBalance || 0 },
        transactions: [],
        totalBookings: 0,
        message: "Email is already in use"
      });
    }
    return res.render("profile", {
      user: {
        name: req.user.name || "Unknown",
        email: req.user.email || "N/A",
        phone: req.user.phone || "N/A",
        address: req.user.address || {
          street: "N/A",
          city: "N/A",
          state: "N/A",
          pincode: "N/A",
          country: "N/A"
        },
        memberSince: req.user.createdAt ? req.user.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "N/A"
      },
      wallet: { balance: req.user.walletBalance || 0 },
      transactions: [],
      totalBookings: 0,
      message: "Server error: Unable to update profile"
    });
  }
}
//Logout 
const logout = async (req, res) => {

  try {

    // Clear the auth_token cookie
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/"
    })
    res.redirect("/login");
    console.log("logout successful");


  } catch (error) {

    console.error("Logout error:", error);
    res.status(500).send("Server error");
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
  loadLandingPage,
  loadHomepage,
  loadSignup,
  signup,
  verifyOTP,
  resendOTP,
  pageNotFound,
  loadLogin,
  login,
  loadCarsPage,
  profile,
  editUserProfile,
  logout

};
