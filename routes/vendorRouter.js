const express = require("express")
const router = express.Router()
const vendorController = require("../controllers/vendor/vendorController")
const vendorAuth = require("../middlewares/vendorAuth")


//Error Page
router.get("/page-error", vendorController.pageError)

//Signup management
router.get("/signup", vendorAuth.checkAuth, vendorController.loadSignup)
router.post("/signup", vendorController.registeration)
router.post("/verify-otp", vendorController.verifyOTP)
router.post("/resend-otp", vendorController.resendOTP);


//Login management
router.get("/login", vendorController.loadLogin)
router.post("/login", vendorController.login)
router.get("/dashboard", vendorAuth.requireAuth, vendorController.getDashboard)


//logout
router.get('/logout', vendorController.logout);

//Profile management
router.get("/forgot-password", vendorController.loadForgotPass)
router.post("/forgot-password", vendorController.forgotValidation)
router.post("/verify-forgot-otp", vendorController.verifyForgotOTP)
router.post("/resend-forget-otp", vendorController.resendForgetOTP)
router.get("/reset-password", vendorController.loadResetPassword)
router.post("/reset-password", vendorController.resetPassword)




module.exports = router