const express = require("express")
const router = express.Router()
const vendorController = require("../controllers/vendor/vendorController ")




//Login management
router.get("/login", vendorController.loadLogin)




module.exports = router