const express = require("express")
const router = express.Router()
const vendorController = require("../controllers/vendor/vendorController")
const vendorAuth = require("../middlewares/vendorAuth")
const carController = require("../controllers/vendor/carController")
const upload = require("../middlewares/multer");


//Error Page
router.get("/page-error", vendorController.pageError)

//Signup management
router.get("/register", vendorAuth.checkAuth, vendorController.loadSignup)
router.post("/register", vendorController.registeration)
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



//Car Management
router.get("/cars/register-cars", vendorAuth.requireAuth, carController.loadCarForm)
router.post("/cars/register-cars", vendorAuth.requireAuth, upload.single("carImage"), carController.registerCar)
router.get("/cars", vendorAuth.requireAuth, carController.listCars)



router.use((req, res) => vendorController.pageError(req, res));



module.exports = router