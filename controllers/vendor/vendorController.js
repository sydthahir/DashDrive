const Vendor = require("../../models/vendorSchema");
const mongoose = require("mongoose");
const TempData = require("../../models/tempVendor");
const jwt = require('jsonwebtoken');
const generateOTP = require('../../utils/otpGenerator');
const sendOtpMail = require('../../utils/mailer');
const { securePassword } = require('../../utils/hashPassword');
const env = require("dotenv").config();
const { CURSOR_FLAGS } = require("mongodb");
const { loadDashboard } = require("../admin/adminController");
const bcrypt = require("bcrypt")



// Error Page
const pageError = async (req, res) => {
    try {
        res.render("pageError");
    } catch (error) {
        res.redirect("/page-error");
    }
};


// Load Signup page
const loadSignup = async (req, res) => {
    try {
        res.render("vendor-signup", { message: null });
    } catch (error) {
        console.log("Signup page not found", error);
        res.status(500).send("Server Error");
    }
};


// Vendor registration
const registeration = async (req, res) => {
    try {


        const {
            firstName,
            lastName,
            phone,
            email,
            password,
            confirmPassword,
            companyName,
            businessAddress,
            businessLicense,
            taxId,
            terms
        } = req.body;

        if (password !== confirmPassword) {
            return res.render("vendor-signup", { message: "Passwords does not match" });
        }

        if (!terms) {
            return res.render("vendor-signup", { message: "You must agree to the terms and conditions" });
        }

        const existingVendor = await Vendor.findOne({ email });
        if (existingVendor) {
            console.log("Email already registered");
            return res.render("vendor-signup", { message: "Account with this email already exists" });
        }

        const otp = generateOTP();




        const emailSent = await sendOtpMail(email, otp);
        if (!emailSent) {
            return res.render("vendor-signup", { message: "Error sending verification email" });
        }



        // Temporarily store registration data and OTP 
        const tempData = {
            firstName,
            lastName,
            phone,
            email,
            password,
            companyName,
            businessAddress,
            businessLicense,
            taxId,
            otp,
            expiresAt: Date.now() + 10 * 60 * 1000 // 10-minute expiration
        };


        //Checks duplicate tempdata
        const existingTempVendor = await TempData.findOne({ email });
        if (existingTempVendor) {
            await TempData.deleteOne({ email }); // 
        }
        await TempData.create(tempData);



        res.render("enter-OTP", { email: tempData.email, message: null });
        console.log("OTP sent successfully", otp);



    } catch (error) {
        console.error("Error while creating vendor account", error);
        res.redirect("/page-error");
    }
};






//OTP verifying
const verifyOTP = async (req, res) => {
    try {
        const { otp, email } = req.body;

        console.log("entered otp", otp);

        // Find temporary data by email
        const tempData = await TempData.findOne({ email });
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



        const newVendor = new Vendor({
            firstName: tempData.firstName,
            lastName: tempData.lastName,
            email: tempData.email,
            phone: tempData.phone,
            password: hashedPassword,
            companyName: tempData.companyName,
            businessAddress: tempData.businessAddress,
            businessLicense: tempData.businessLicense,
            taxId: tempData.taxId,
            isVerified: true,
            isApproved: false
        });

        await newVendor.save();
        console.log("New vendor created");


        // Delete temporary data
        await TempData.deleteOne({ email });

        //Generating JWT token
        const token = jwt.sign(
            { id: newVendor._id, email: newVendor.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        console.log("token is :", token);


        // Send JSON response 
        return res.status(200).json({
            success: true,
            message: "Registration successful, Account is under verification.Please wait for approval"
        });

    } catch (error) {
        console.error("Error verifying OTP:", error.message);
        return res.status(500).json({
            success: false,
            message: "An error occurred while verifying OTP. Please try again."
        });
    }
};


//Resend OTP
const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;


        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required to resend OTP"
            });
        }

        const tempData = await TempData.findOne({ email });
        if (!tempData) {
            return res.status(400).json({
                success: false,
                message: "No pending registration found for this email",
            });
        }

        const newOTP = generateOTP();



        const emailSent = await sendOtpMail(email, newOTP);
        if (!emailSent) {
            return res.render("vendor-signup", { message: "Error sending verification email" });
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




// Load login page 
const loadLogin = (req, res) => {
    const message = req.query.message || null;
    res.render("vendor-login", { message });
};


//login
const login = async (req, res) => {
    try {
        const { email, password } = req.body

        const findVendor = await Vendor.findOne({ email: email })

        if (!findVendor) {
            return res.render("vendor-login", { message: "Account not found" })
        }

        // Check if account is approved
        if (findVendor.isApproved) {
            res.render("vendor-login", { message: "Account is not yet approved  " })
        }

        const passwordMatch = await bcrypt.compare(password, findVendor.password)

        if (!passwordMatch) {
            return res.render("vendor-login", { message: "Incorrect Email or  Password" })
        }


        const token = jwt.sign(
            { vendorId: findVendor._id, email: findVendor.email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );


        res.clearCookie("auth_token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/"
        });

        res.cookie("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 3600000,
            sameSite: "strict"
        })
        console.log("Login success for:", email);
        res.redirect("/vendor/dashboard")






    } catch (error) {
        console.error("Login error:", error);
        res.render("vendor-login", { message: "An error occurred. Please try again." });
    }

}

const getDashboard = async (req, res) => {
    try {


        if (!req.vendor.isApproved) {
            return res.redirect("/vendor/login?message=Account is not yet approved by admin");
        }
        return res.render("vendorDashboard");

    } catch (error) {
        console.log("Dashboard error");
        res.status(500).send("Server error");
    }
}



//Loading of forgot password page
const loadForgotPass = async (req, res) => {
    try {
        res.render("forgotPass")
    } catch (error) {
        console.error("Error in forgotPassPage:", error);
        res.redirect("/pageNotFound")
    }
}

// OTP for password reset
const forgotValidation = async (req, res) => {
    try {
        const { email } = req.body;
        console.log(req.body);
        const findVendor = await Vendor.findOne({ email: email });
        console.log(findVendor);

        if (!email) {
            return res.render("forgotPass", { message: "Please provide an email address." });
        }

        const trimmedEmail = email.trim();
        const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
        if (!emailPattern.test(trimmedEmail)) {
            return res.render("forgotPass", { message: "Please enter a valid email address." });
        }

        if (!findVendor) {
            return res.render("forgotPass", { message: "Vendor not found" });
        }

        const otp = generateOTP();
        console.log("Your OTP is:", otp);

        // Set expiration to 5 minutes from now
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        findVendor.resetOTP = otp;
        findVendor.resetOTPExpiry = expiresAt;
        await findVendor.save();

        // Send the OTP to the user's email
        const emailSent = await sendVerifyEmail(trimmedEmail, otp);
        if (!emailSent) {
            return res.render("forgotPass", { message: "Failed to send OTP" });
        }

        res.render("forgotPasswordOTP", { email: trimmedEmail, message: "OTP sent to your email" });
    } catch (error) {
        console.error("Error in forgotValidation:", error);
        res.redirect("/page-error");
    }
};

// Verification of OTP (for forgot password)
const verifyForgotOTP = async (req, res) => {
    try {

        const { email, otp } = req.body;

        if (!otp || !email) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required.",
            });
        }

        // Find the vendor by email
        const vendor = await Vendor.findOne({ email });

        if (!vendor) {
            return res.status(400).json({
                success: false,
                message: "Vendor not found",
            });
        }


        // Check if OTP exists and is not expired
        if (!vendor.resetOTP || !vendor.resetOTPExpiry) {
            return res.status(400).json({
                success: false,
                message: "No OTP request found",
            });
        }
        console.log("Reached verifyForgotOTP");

        if (new Date() > vendor.resetOTPExpiry) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired",
            });
        }



        //Compare OTP
        if (vendor.resetOTP !== String(otp).trim()) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
            });
        }




        // Clear OTP fields after successful verification
        vendor.resetOTP = undefined;
        vendor.resetOTPExpiry = undefined;
        await vendor.save();


        // Generate a JWT token for password reset
        const resetToken = jwt.sign(
            { email: vendor.email, purpose: "reset-password" },
            process.env.JWT_SECRET,
            { expiresIn: "15m" } // Short expiration for security
        );
        return res.status(200).json({
            success: true,
            message: "OTP verified successfully",
        });


    } catch (error) {
        console.error("Error verifying OTP:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// Resend OTP for forgot password
const resendForgetOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required."
            });
        }

        const vendor = await Vendor.findOne({ email });
        if (!vendor) {
            return res.status(400).json({
                success: false,
                message: "Vendor not found."
            });
        }

        const newOTP = generateOTP();
        console.log("Resent OTP is:", newOTP);

        vendor.resetOTP = newOTP;
        vendor.resetOTPExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry
        await vendor.save();

        const emailSent = await sendVerifyEmail(email, newOTP);
        if (!emailSent) {
            return res.status(500).json({
                success: false,
                message: "Failed to resend OTP."
            });
        }

        return res.status(200).json({
            success: true,
            message: "OTP resent successfully."
        });
    } catch (error) {
        console.error("Error resending OTP:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while resending OTP."
        });
    }
};

// Load Reset Password Page
const loadResetPassword = async (req, res) => {
    try {
        if (!req.session.canResetPassword || !req.session.resetEmail) {
            return res.redirect("/vendor/forgot-password");
        }
        res.render("resetPassword", { email: req.session.resetEmail, message: null });
    } catch (error) {
        console.error("Error loading reset password page:", error);
        res.redirect("/page-error");
    }
};

// Handle Password Reset
const resetPassword = async (req, res) => {
    try {
        const { password, confirmPassword } = req.body;
        const email = req.session.resetEmail;

        if (!req.session.canResetPassword || !email) {
            return res.render("resetPassword", { email: null, message: "Session expired. Please try again." });
        }

        if (password !== confirmPassword) {
            return res.render("resetPassword", { email, message: "Passwords do not match." });
        }

        const vendor = await Vendor.findOne({ email });
        if (!vendor) {
            return res.render("resetPassword", { email, message: "Vendor not found." });
        }

        const hashedPassword = await securePassword(password);
        vendor.password = hashedPassword;
        await vendor.save();

        // Clear session
        req.session.canResetPassword = false;
        req.session.resetEmail = null;

        res.redirect("/vendor/login?message=Password reset successful");
    } catch (error) {
        console.error("Error resetting password:", error);
        res.render("resetPassword", { email: req.session.resetEmail, message: "An error occurred." });
    }
};

//logout
const logout = async (req, res) => {
    try {
        res.clearCookie("auth_token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
        });
        console.log("logout successful");
        return res.redirect("/vendor/login");


    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).send("Server error");
    }
}


module.exports = {
    pageError,
    loadSignup,
    registeration,
    verifyOTP,
    resendOTP,
    loadForgotPass,
    forgotValidation,
    verifyForgotOTP,
    resendForgetOTP,
    loadResetPassword,
    resetPassword,
    loadLogin,
    login,
    getDashboard,
    logout
};