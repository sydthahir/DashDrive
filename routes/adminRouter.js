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


//Forget Management


//Users management
router.get("/users", adminAuth, adminController.loadUsers)
router.post("/users/block", adminAuth, adminController.customerBlocked)
router.post("/users/unblock", adminAuth, adminController.customerUnblocked)

//Bookings management
router.get("/bookings", adminAuth, adminController.loadBookings)

//Vendors management
router.get("/vendors", adminAuth, adminController.loadVendors)
router.get("/pending-vendors", adminController.getPendingVendors)
router.post('/vendors/approve/:id', adminController.approveVendor);
router.post('/vendors/reject/:id', adminController.rejectVendor);












module.exports = router