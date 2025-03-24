const express = require("express")
const passport = require('passport')
const jwt = require("jsonwebtoken")
const env = require("dotenv").config()
const router = express.Router()
const userController = require("../controllers/user/userControllers")
const userAuth = require("../middlewares/userAuth")
const profileControllers = require("../controllers/user/profileControllers")


router.get("/pageNotFound", userController.pageNotFound)

//Signup Management
router.get("/signup", userController.loadSignup)
router.post("/signup", userController.signup)


//Login Management
router.get("/login", userController.loadLogin)
router.post("/login", userController.login)

router.post("/verify-otp", userController.verifyOTP)
router.post("/resend-otp", userController.resendOTP)

//Home page management
router.get("/", userController.loadHomepage)


router.get("/profile", userController.profile)
router.get("/cars", userController.loadCarsPage)


//Profile management
router.get("/forgot-password", profileControllers.loadForgotPassPage)
router.post("/forgot-email-valid", profileControllers.forgotEmailValid)
router.post("/verify-passForgot-otp", profileControllers.verifyForgotPassOTP)
router.get("/reset-password", profileControllers.loadResetPassPage)
router.post("/resend-forget-otp", profileControllers.resendOTP)
router.post("/reset-password", profileControllers.postNewPassword)


//Google auth routes

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

router.get('/auth/google/callback', passport.authenticate("google", { session: false }),
    (req, res) => {
        const token = jwt.sign(
            { id: req.user.id, name: req.user.name, email: req.user.email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
        console.log("Google account login success");


        res.redirect("/")
    }
);



router.get("/", passport.authenticate("jwt", { session: false }), (req, res) => {
    res.json({ message: `Welcome, ${req.user.name}!` });
});







module.exports = router