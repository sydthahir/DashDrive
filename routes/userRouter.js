const express = require("express")
const passport = require('passport')
const jwt = require("jsonwebtoken")
const env = require("dotenv").config()
const router = express.Router()
const userController = require("../controllers/user/userControllers")
const userAuth = require("../middlewares/userAuth")
const profileControllers = require("../controllers/user/profileControllers")



//page-not-found 
router.get("/pageNotFound", userController.pageNotFound)

//Landing page
router.get("/", userController.loadLandingPage)

//Signup Management
router.get("/signup", userController.loadSignup)
router.post("/signup", userController.signup)

router.post("/verify-otp", userController.verifyOTP)
router.post("/resend-otp", userController.resendOTP)


//Login Management
router.get("/login", userController.loadLogin)
router.post("/login", userController.login)



//Home page management
router.get("/home", userAuth, userController.loadHomepage)



router.get("/profile", userAuth, userController.profile)
router.post("/profile/edit", userAuth, userController.editUserProfile)
router.get("/cars", userController.loadCarsPage)
router.get("/logout", userController.logout)


//Profile management
router.get("/forgot-password", profileControllers.loadForgotPassPage)
router.post("/forgot-email-valid", profileControllers.forgotEmailValid)
router.post("/verify-passForgot-otp", profileControllers.verifyForgotPassOTP)
router.get("/reset-password", profileControllers.loadResetPassPage)
router.post("/resend-forget-otp", profileControllers.resendOTP)
router.post("/reset-password", profileControllers.postNewPassword)


//Google auth routes

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

router.get('/auth/google/callback',
    passport.authenticate("google", { session: false, failureRedirect: '/login' }),
    async (req, res) => {
        try {
            const user = req.user;
            if (!user) {
                console.log("No user data in request");
                return res.redirect('/login');
            }

            // Generate JWT token
            const token = jwt.sign(
                {
                    userId: user._id.toString(), // Ensure ID is a string
                    email: user.email,
                    name: user.name
                },
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );

            // Clear any existing auth token
            res.clearCookie("auth_token", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                path: "/"
            });

            // Set the new auth token
            res.cookie('auth_token', token, {
                httpOnly: true,
                secure: false, // Set to false for development
                maxAge: 3600000, // 1 hour
                sameSite: "lax", // Changed to lax for Google Auth
                path: "/"
            });

            console.log("Google auth successful for:", user.email);


            return res.redirect("/home");
        } catch (error) {
            console.error("Error in Google auth callback:", error);
            return res.redirect('/login');
        }
    }
);

router.get("/", passport.authenticate("jwt", { session: false }), (req, res) => {
    res.json({ message: `Welcome, ${req.user.name}!` });
});







module.exports = router