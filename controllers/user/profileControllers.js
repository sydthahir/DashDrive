const User = require("../../models/userSchema")
const nodemailer = require("nodemailer")
const bcrypt = require("bcryptjs")
const env = require("dotenv").config();
const jwt = require("jsonwebtoken");
const OTP = require("../../models/otpSchema")






//OTP Generation
function generateOTP() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}



//Verification email sending
async function sendVerificationEmail(email, otp) {
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
            subject: "Your OTP for password reset",
            text: `Your OTP is ${otp}`,
            html: `<b>Your OTP : ${otp}</b>`,
        });

        return info.accepted.length > 0;
    } catch (error) {
        console.error("Error while sending email", error);
        return false;
    }
}

//password hashing
const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.error("Error hashing password:", error);
        throw error;
    }
};


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


        const otp = generateOTP()
        console.log("your otp is: ", otp);

        // Set expiration to 5 minutes from now
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        // Delete any existing OTPs
        await OTP.deleteMany({ userId: findUser._id });


        // Create and save the OTP document
        const otpDoc = new OTP({
            userId: findUser._id,
            otp: otp,
            expiresAt: expiresAt
        });
        await otpDoc.save();

        req.session.userId = findUser._id.toString();


        // Send the OTP to the user's email
        const emailSend = await sendVerificationEmail(email, otp);
        if (!emailSend) {

            return res.status(500).json({ message: "Failed to send OTP" });
        }


        res.render("forgotPass-otp");


    } catch (error) {
        console.error("Error in forgotEmailValid:", error);
        res.redirect("/pageNotFound");


    }
}

//Verification of OTP
const verifyForgotPassOTP = async (req, res) => {
    try {
        const { otp } = req.body;
        const userId = req.session.userId;

        if (!otp || !userId) {
            return res.status(400).json({
                success: false,
                message: "OTP and token are required.",
            });
        }

        //find the otp document
        const otpDoc = await OTP.findOne({ userId: userId });


        if (!otpDoc) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP",
            });
        }



        if (new Date() > otpDoc.expiresAt) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired",
            });
        }

        // Compare OTP with  stored OTP in DB
        if (otpDoc.otp === otp) {

            await OTP.deleteOne({ _id: otpDoc._id });
            req.session.canResetPassword = true;
            return res.status(200).json({
                success: true,
                message: 'OTP verified, you can reset your password',
            });

        }

        else {
            // OTP is incorrect
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
            });
        }

    } catch (error) {

        console.error("Error verifying OTP", error);
        res.status(400).json({
            success: false,
            message: "Server error",
        });
    }
}

// Loading of  reset password page
const loadResetPassPage = async (req, res) => {
    try {
        if (req.session.canResetPassword) {
            res.render('reset-password');
        } else {
            res.redirect('/forgot-password?message=Please%20verify%20OTP%20first');
        }
    } catch (error) {
        console.error("Error in loadResetPassPage:", error);
        res.redirect('/pageNotFound');
    }
};

//Otp resend
const resendOTP = async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(400).json({ message: 'User session not found' });
        }

        // Find the OTP record by token
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await OTP.deleteMany({ userId });


        const newOtp = generateOTP();

        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        const otpDoc = new OTP({
            userId,
            otp: newOtp,
            expiresAt,
        });
        await otpDoc.save()

        const emailSent = await sendVerificationEmail(user.email, newOtp);
        if (!emailSent) {
            return res.status(500).json({ message: 'Failed to send OTP' });
        }

        res.status(200).json({ message: 'OTP resent successfully' });
        console.log("resend otp is:", newOtp);


    }
    catch (error) {
        console.error('Error resending OTP:', error);
        res.status(500).json({ message: 'Internal server error' });
    }


}


//Password resetting
const postNewPassword = async (req, res) => {

    console.log("Password from request:", req.body.newPassword);
    try {

        const { newPassword, confirmPassword } = req.body;
        const userId = req.session.userId;

        if (newPassword === confirmPassword) {
            const passwordHash = await securePassword(newPassword)


            await User.updateOne(
                { _id: userId },
                {
                    $set: { password: passwordHash }
                }


            )
            console.log("Password Reset Success");

            const user = await User.findById(userId);
            if (user && user.isAdmin) {
                return res.redirect("/admin/login");
            } else {
                return res.redirect("/login");
            }
        }
    } catch (error) {
        console.error("Error in postNewPassword:", error);
        return res.redirect("/pageNotFound");
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