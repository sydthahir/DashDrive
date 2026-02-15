const express = require("express")
const passport = require('passport')
const jwt = require("jsonwebtoken")
const env = require("dotenv").config()
const router = express.Router()
const userController = require("../controllers/user/userControllers")
const slotController = require("../controllers/vendor/slotController")
const bookingController = require("../controllers/user/bookingController")
const { authenticateUser, guestOnly } = require("../middlewares/userAuth")
const profileControllers = require("../controllers/user/profileControllers")
const noCache = require("../middlewares/noCache")

//page-not-found 
router.get("/pageNotFound", userController.pageNotFound)

//Landing page
router.get("/", userController.loadLandingPage)

//Signup Management
router.get("/signup", noCache, guestOnly, userController.loadSignup)
router.post("/signup", userController.signup)

router.post("/verify-otp", userController.verifyOTP)
router.post("/resend-otp", userController.resendOTP)


//Login Management
router.get("/login", noCache, guestOnly, userController.loadLogin)
router.post("/login", userController.login)



//Home page management
router.get("/home", authenticateUser, userController.loadHomepage)

router.get("/avail-soon", authenticateUser, userController.loadCarsPage)

// Cars page 
router.get("/cars", userController.loadListings)
router.get("/cars/:id", userController.loadCarDetails)

// Slot Selction 
router.get("/cars/:carId/available-slots", slotController.getUserSlots);

// Favorites
router.get("/favourites", authenticateUser, userController.loadFavourites)
router.post("/toggle-favourite", authenticateUser, userController.toggleFavourite)

//Booking management
router.get("/bookings/new/:carId", authenticateUser, bookingController.loadBookingDetails);
router.post("/booking/create", authenticateUser, bookingController.createBooking)
router.get("/bookings/confirmation/:bookingId", authenticateUser, bookingController.loadBookingConfirmation)
router.get("/booking/:bookingId", authenticateUser, bookingController.viewBooking)
router.post("/booking/cancel/:bookingId", authenticateUser, bookingController.cancelBooking)

router.get("/services", userController.loadServices)
router.get("/contact", userController.loadContact)
router.get("/about", userController.loadAbout)
router.get("/logout", userController.logout)


//Profile management
router.get("/profile", authenticateUser, userController.profile)
router.post("/profile/edit", authenticateUser, userController.editUserProfile)

router.get("/forgot-password", noCache, guestOnly, profileControllers.loadForgotPassPage)
router.post("/forgot-email-valid", profileControllers.forgotEmailValid)
router.post("/verify-passForgot-otp", profileControllers.verifyForgotPassOTP)
router.get("/reset-password", profileControllers.loadResetPassPage)
router.post("/resend-forget-otp", profileControllers.resendOTP)
router.post("/reset-password", profileControllers.postNewPassword)

router.get("/change-password", authenticateUser, profileControllers.loadChangePassword);
router.post("/change-password", authenticateUser, profileControllers.changePassword);



//Google auth routes
router.get('/auth/google', guestOnly, passport.authenticate('google', { scope: ['profile', 'email'] }))

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
                    userId: user._id.toString(),
                    email: user.email
                },
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );

            // Clear any existing auth token
            res.clearCookie("user_token", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/"
            });

            // Set the new auth token
            res.cookie('user_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 3600000, // 1 hour
                sameSite: "lax",
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