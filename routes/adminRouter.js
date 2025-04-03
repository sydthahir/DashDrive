const express = require("express")
const router = express.Router()
const adminController = require("../controllers/admin/adminController")
const adminAuth = require("../middlewares/adminAuth")


//Error page
router.get("/page-error", adminController.pageError)

//Login Management
router.get("/login", adminController.loadLogin)
router.post("/login", adminController.login)
router.get("/", adminAuth, adminController.loadDashboard)

//Logout Managment
router.get('/logout', adminController.logout);

//Users management
router.get("/users", adminAuth, adminController.loadUsers)
router.get("/blockCustomer", adminAuth, adminController.customerBlocked)
router.get("/unblockCustomer", adminAuth, adminController.customerUnblocked)

//Bookings management
router.get("/bookings", adminAuth, adminController.loadBookings)

//Vendors management
router.get("/vendors", adminAuth, adminController.loadVendors)










module.exports = router