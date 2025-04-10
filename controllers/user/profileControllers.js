const User = require("../../models/userSchema")
const TempUser = require('../../models/tempUserSchema')
const generateOTP = require('../../utils/otpGenerator');
const sendOtpMail = require('../../utils/mailer');
const { securePassword } = require('../../utils/hashPassword');

const bcrypt = require("bcryptjs")
const env = require("dotenv").config();
const jwt = require("jsonwebtoken");
// const OTP = require("../../models/otpSchema")




//Loading of forgot password page
const loadForgotPassPage = async (req, res) => {
    try {
        res.render("forgot-password")
    } catch (error) {
        console.error("Error in forgotPassPage:", error);
        res.redirect("/pageNotFound")
    }
}


//Otp for password reset
const forgotEmailValid = async (req, res) => {
    try {
        const { email } = req.body
        console.log("email is :", email);

        const findUser = await User.findOne({ email: email })

        if (!email) {
            return res.render("forgot-password", { message: "Please provide an email address." });
        }

        const trimmedEmail = email.trim();
        const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
        if (!emailPattern.test(trimmedEmail)) {
            return res.render("forgot-password", { message: "Please enter a valid email address." });
        }

        if (!findUser) {
            return res.render("forgot-password", { message: "User not found" });
        }

        const otp = generateOTP();
        console.log("Your OTP is:", otp);

        // Set expiration to 5 minutes from now
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);


        findUser.resetOTP = otp;
        findUser.resetOTPExpiry = expiresAt;
        await findUser.save();




        // Send the OTP to the user's email
        const emailSent = await sendOtpMail(email, otp);
        if (!emailSent) {
            return res.render("forgot-password", { message: "Failed to send OTP" });
        }
        res.render("forgotPass-otp", { email: trimmedEmail, message: "OTP sent to your email" });


    } catch (error) {
        console.error("Error in forgotEmailValid:", error);
        res.redirect("/pageNotFound");


    }
}

//Verification of OTP
const verifyForgotPassOTP = async (req, res) => {
    try {

        const { email, otp } = req.body;

        if (!otp || !email) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required.",
            });
        }

        // Find the user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found",
            });
        }


        // Check if OTP exists and is not expired
        if (!user.resetOTP || !user.resetOTPExpiry) {
            return res.status(400).json({
                success: false,
                message: "No OTP request found",
            });
        }


        if (new Date() > user.resetOTPExpiry) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired",
            });
        }

        // Compare OTP with  stored OTP in DB
        if (user.resetOTP !== String(otp).trim()) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
            });
        }




        // Clear OTP fields after verification
        user.resetOTP = undefined;
        user.resetOTPExpiry = undefined;
        await user.save();


        // Generate a JWT token 
        const resetToken = jwt.sign(
            { email: user.email, purpose: "reset-password" },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );
        return res.status(200).json({
            success: true,
            message: "OTP verified successfully",
            resetToken
        });





    } catch (error) {

        console.error("Error verifying OTP", error);
        res.status(400).json({
            success: false,
            message: "Server error",
        });
    }
}


//Otp resend
const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found"
            });
        }

        const newOTP = generateOTP();
        user.resetOTP = newOTP;
        user.resetOTPExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry
        await user.save();

        const emailSent = await sendOtpMail(email, newOTP);
        if (!emailSent) {
            return res.status(500).json({
                success: false,
                message: "Failed to send OTP"
            });
        }

        console.log("Resent OTP is:", newOTP);
        return res.status(200).json({
            success: true,
            message: "OTP resent successfully"
        });

    } catch (error) {
        console.error("Error resending OTP:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while resending OTP"
        });
    }
};

// Loading of  reset password page
const loadResetPassPage = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.redirect("/user/forgot-password?error=No reset token provided");
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.redirect("/user/forgot-password?error=Invalid or expired reset token");
        }



        const user = await User.findOne({ email: decoded.email });
        if (!user) {
            return res.redirect("/user/forgot-password?error=User not found");
        }

        res.render("reset-password", { email: decoded.email, message: null, token });
    } catch (error) {
        console.error("Error in loadResetPassPage:", error);
        res.redirect('/pageNotFound');
    }
}

//Password resetting
const postNewPassword = async (req, res) => {


    try {

        const { password, confirmPassword, token, email } = req.body;


        if (!token) {

            console.log("No token");

            return res.status(400).json({
                success: false,
                message: "No reset token provided"
            })
        }



        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token"
            })
        }



        const user = await User.findOne({ email: decoded.email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found"
            });
        }



        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match"
            });
        }

        const hashedPassword = await securePassword(password);
        user.password = hashedPassword;
        await user.save();
        console.log("Password reset success");


        return res.status(200).json({
            success: true,
            message: "Password reset successful,Please login now"
        });

    }


    catch (error) {
        console.error("Error in postNewPassword:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
}




module.exports = {
    loadForgotPassPage,
    forgotEmailValid,
    verifyForgotPassOTP,
    loadResetPassPage,
    resendOTP,
    postNewPassword
}