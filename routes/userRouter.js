const express = require("express")
const router = express.Router()
const userController =  require("../controllers/user/userControllers")
const userAuth = require("../middlewares/userAuth")


router.get("/",userAuth,userController.loadHomepage)
router.get("/signup",userController.loadSignup)
router.post("/signup",userController.signup)
router.get("/login",userController.loadLogin)
router.post("/ver")












module.exports = router