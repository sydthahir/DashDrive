const express = require("express")
const router = express.Router()
const adminController = require("../controllers/admin/adminController")
const adminAuth = require("../middlewares/adminAuth")
const {uploadBrandLogo} = require("../middlewares/upload")



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
router.post("/users/block", adminAuth, adminController.customerBlocked)
router.post("/users/unblock", adminAuth, adminController.customerUnblocked)
router.get("/users/details/:id", adminAuth, adminController.getUserDetails)

//Bookings management
router.get("/bookings", adminAuth, adminController.loadBookings)

//Vendors management
router.get("/vendors", adminAuth, adminController.loadVendors)
router.get("/pending-vendors", adminAuth, adminController.getPendingVendors)
router.post('/vendors/approve/:id', adminAuth, adminController.approveVendor);
router.post('/vendors/reject/:id', adminAuth, adminController.rejectVendor);
router.post('/vendors/block', adminAuth, adminController.blockVendor);
router.post('/vendors/unblock', adminAuth, adminController.unblockVendor);
router.get('/vendors/details/:id', adminAuth, adminController.getVendorDetails);

//Brands management
router.get("/brands", adminAuth, adminController.loadBrands)
router.post("/brands/add", adminAuth, uploadBrandLogo.single("logo"), adminController.addBrand);
router.put("/brands/edit", adminAuth, uploadBrandLogo.single("logo"), adminController.editBrand);
router.patch("/brands/toggle-status", adminAuth, adminController.toggleBrandStatus);

//Cars management
router.get("/cars-management", adminAuth, adminController.loadCarManagement);
router.get("/cars/details/:id", adminAuth, adminController.getCarDetails);
router.post("/cars/approve/:id", adminAuth, adminController.approveCar);
router.post("/cars/reject/:id", adminAuth, adminController.rejectCar);



router.use((req, res) => adminController.pageError(req, res));











module.exports = router