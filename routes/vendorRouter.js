const express = require("express")
const router = express.Router()
const vendorController = require("../controllers/vendor/vendorController")
const vendorAuth = require("../middlewares/vendorAuth")
const carController = require("../controllers/vendor/carController")
const upload = require("../middlewares/upload");


//Error Page
router.get("/page-error", vendorController.pageError)

//Signup management
router.get("/register", vendorAuth.checkAuth, vendorController.loadSignup)
router.post("/register", vendorController.registeration)
router.post("/verify-otp", vendorController.verifyOTP)
router.post("/resend-otp", vendorController.resendOTP);


//Login management
router.get("/login", vendorAuth.checkAuth,vendorController.loadLogin)
router.post("/login", vendorController.login)
router.get("/", vendorAuth.requireAuth, vendorController.getDashboard)


//logout
router.get('/logout', vendorAuth.requireAuth, vendorController.logout);

//Profile management
router.get("/profile", vendorAuth.requireAuth, vendorController.profile)
router.post("/profile/update", vendorAuth.requireAuth, upload.single("profileImage"), vendorController.updateProfile)

router.get("/forgot-password", vendorController.loadForgotPass)
router.post("/forgot-password", vendorController.forgotValidation)
router.post("/verify-forgot-otp", vendorController.verifyForgotOTP)
router.post("/resend-forget-otp", vendorController.resendForgetOTP)
router.get("/reset-password", vendorController.loadResetPassword)
router.post("/reset-password", vendorController.resetPassword)



router.get("/bookings", vendorAuth.requireAuth, vendorController.loadBookings)
router.get("/earnings", vendorAuth.requireAuth, vendorController.loadEarnings)

//Car Management
router.get("/cars/register-cars", vendorAuth.requireAuth, carController.loadCarForm)
router.post("/cars/register-cars", vendorAuth.requireAuth, upload.array("carImages", 5), carController.registerCar)
router.get("/cars", vendorAuth.requireAuth, carController.listCars)



router.use((req, res) => vendorController.pageError(req, res));



module.exports = router