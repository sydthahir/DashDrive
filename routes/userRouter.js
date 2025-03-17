const express = require("express")
const passport = require('passport')
const jwt = require("jsonwebtoken")
const env = require("dotenv").config()
const router = express.Router()
const userController = require("../controllers/user/userControllers")
const userAuth = require("../middlewares/userAuth")


router.get("/pageNotFound", userController.pageNotFound)

//Signup Management

router.get("/", userAuth, userController.loadHomepage)
router.get("/signup", userController.loadSignup)
router.post("/signup", userController.signup)
router.get("/login", userController.loadLogin)
router.post("/login", userController.login)
router.post("/verify-otp", userController.verifyOTP)
router.post("/resend-otp", userController.resendOTP)

//Google auth routes

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

router.get('/auth/google/callback', passport.authenticate("google", { session: false }),
    (req, res) => {
        const token = jwt.sign(
            { id: req.user.id, name: req.user.name, email: req.user.email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.redirect("/login")
    }
);



router.get("/", passport.authenticate("jwt", { session: false }), (req, res) => {
    res.json({ message: `Welcome, ${req.user.name}!` });
});







module.exports = router