const User = require("../../models/userSchema")
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
require("dotenv").config()
const Vendor = require("../../models/vendorSchema")
const Brand = require("../../models/brandModel")
const {
  sendVendorApprovalMail,
  sendVendorRejectionMail,
  sendCarApprovalMail,
  sendCarRejectionMail
} = require("../../utils/mailer")

//Page error
const pageError = (req, res) => {
  try {
    res.status(404).render("page-error", {
      message: "Page not found",
      error: null,
    })
  } catch (error) {
    console.error("Error rendering 404 page:", error)
    res.status(500).send("Internal Server Error") // for Critical errors
  }
}

//Loading of login page
const loadLogin = (req, res) => {
  const error = req.query.error || null

  if (req.cookies.admin_token) {
    return res.redirect("/admin/")
  }
  res.render("admin-login", { message: error, error: error })
}

//Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).render("admin-login", {
        message: "Email and password are required",
        error: "Email and password are required",
      })
    }

    const admin = await User.findOne({ email, isAdmin: true })
    if (!admin) {
      return res.status(401).render("admin-login", {
        message: "Admin account not found",
        error: "Admin account not found",
      })
    }

    const passwordMatch = await bcrypt.compare(password, admin.password)
    if (!passwordMatch) {
      return res.status(401).render("admin-login", {
        message: "Incorrect email or password",
        error: "Incorrect email or password",
      })
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: admin._id,
        isAdmin: true,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    )

    res.cookie("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3600000, // 1 hour in milliseconds
      path: "/",
    })

    return res.redirect("/admin/")
  } catch (error) {
    console.error("Login error:", error)
    return res.redirect("/page-error")
  }
}

//Loading of Dashboard
const loadDashboard = async (req, res) => {
  try {
    const adminId = req.user.id
    const admin = await User.findById(adminId)

    if (!admin || !admin.isAdmin) {
      return res.redirect("/admin/login?error=Unauthorized access")
    }

    res.render("dashboard")
  } catch (error) {
    console.error("Dashboard error:", error)
    return res.redirect("/page-error")
  }
}

//Loading of users list
const loadUsers = async (req, res) => {
  try {
    const adminId = req.user.id

    // User Searching
    const search = req.query.search || ""

    // Pagination parameters
    const page = parseInt(req.query.page) || 1
    const limit = 3 // Number of users per page
    const skip = (page - 1) * limit
    const searchFilter = {
      isAdmin: false,
      name: { $regex: search, $options: "i" },
    }
    const [totalUsers, activeUsers, newUsers, users, admin, totalCount] =
      await Promise.all([
        User.countDocuments({ isAdmin: false }),
        User.countDocuments({ isBlocked: false, isAdmin: false }),
        User.countDocuments({
          createdAt: {
            $gte: new Date(new Date().setDate(1)).setHours(0, 0, 0, 0),
          },
          isAdmin: false,
        }),

        User.find(searchFilter)
          .select("_id name email createdAt isBlocked")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        User.findById(adminId),
        User.countDocuments(searchFilter),
      ])

    const totalPages = Math.ceil(totalCount / limit)

    if (!admin || !admin.isAdmin) {
      return res.redirect("/admin/login?error=Unauthorized access")
    }

    res.render("users", {
      admin,
      users,
      totalUsers,
      activeUsers,
      newUsers,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      search,
    })
  } catch (error) {
    console.error("Error loading users:", error)
    return res.redirect("/page-error")
  }
}

const getUserDetails = async (req, res) => {
  try {
    const userId = req.params.id

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" })
    }
    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (!req.user || !req.user.id) {
      console.log("No authenticated admin found")
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" })
    }

    const adminId = req.user.id
    const admin = await User.findById(adminId)
    if (!admin || !admin.isAdmin) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized access" })
    }

    return res.status(200).json({
      success: true,
      message: "User details retrieved successfully",
      user: {
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        isBlocked: user.isBlocked,
        walletBalance: user.walletBalance,
      },
    })
  } catch (error) {
    console.error("Error fetching user details:", error)
    return res.status(500).json({ success: false, message: "Server error" })
  }
}

//Customer Block
const customerBlocked = async (req, res) => {
  try {
    const { id } = req.body
    console.log("Blocking user with ID:", id)

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" })
    }

    const user = await User.findById(id)
    if (!user || user.isAdmin) {
      return res
        .status(404)
        .json({ success: false, message: "User not found or is an admin" })
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: { isBlocked: true } },
      { new: true },
    )

    if (!updatedUser) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to block user" })
    }

    return res.status(200).json({
      success: true,
      message: "User blocked successfully",
      user: {
        id: updatedUser._id,
        isBlocked: updatedUser.isBlocked,
      },
    })
  } catch (error) {
    console.error("Error blocking user:", error)
    return res.status(500).json({ success: false, message: "Server error" })
  }
}

//Customer Unblock
const customerUnblocked = async (req, res) => {
  try {
    const { id } = req.body
    console.log("Unblocking user with ID:", id)
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" })
    }

    const user = await User.findById(id)
    if (!user || user.isAdmin) {
      return res
        .status(404)
        .json({ success: false, message: "User not found or is an admin" })
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: { isBlocked: false } },
      { new: true },
    )

    if (!updatedUser) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to unblock user" })
    }

    return res.status(200).json({
      success: true,
      message: "User unblocked successfully",
      user: {
        id: updatedUser._id,
        isBlocked: updatedUser.isBlocked,
      },
    })
  } catch (error) {
    console.error("Error unblocking user:", error)
    return res.status(500).json({ success: false, message: "Server error" })
  }
}

//Loading of Bookings
const loadBookings = async (req, res) => {
  try {
    const adminId = req.user.id
    const admin = await User.findById(adminId)

    if (!admin || !admin.isAdmin) {
      return res.redirect("/admin/login")
    }

    res.render("bookings")
  } catch (error) {
    console.error("Bookings page error:", error)
    return res.redirect("/page-error")
  }
}

//Load Vendors
const loadVendors = async (req, res) => {
  try {
    const adminId = req.user.id
    const admin = await User.findById(adminId)

    // User Searching
    const search = req.query.search || ""

    if (!admin || !admin.isAdmin) {
      return res.redirect("/admin/login")
    }

    // Pagination parameters
    const page = parseInt(req.query.page) || 1
    const limit = 3 // Number of vendors per page
    const skip = (page - 1) * limit
    const searchFilter = {
      status: "approved",
      $or: [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    }

    const [vendors, totalCount, totalVendors, activeVendors, newVendors] =
      await Promise.all([
        Vendor.find(searchFilter)
          .select("fullName email phone isApproved isBlocked createdAt")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Vendor.countDocuments(searchFilter), // Total approved vendors 
        Vendor.countDocuments({ status: "approved" }), // For stats card
        Vendor.countDocuments({ status: "approved", isBlocked: false }), // Active vendors
        Vendor.countDocuments({
          status: "approved",
          createdAt: {
            $gte: new Date(new Date().setDate(1)).setHours(0, 0, 0, 0),
          },
        }), //vendors this month
      ])

    const totalPages = Math.ceil(totalCount / limit)

    res.render("vendors", {
      admin,
      vendors,
      totalVendors,
      activeVendors,
      newVendors,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      currentPage: page,
      search,
    })
  } catch (error) {
    console.error("Vendor page error:", error)
    return res.redirect("/page-error")
  }
}

//Pending Vendors
const getPendingVendors = async (req, res) => {
  try {
    const pendingVendors = await Vendor.find({
      status: "pending",
    })
      .select("fullName email phone createdAt documentUrl")
      .sort({ createdAt: -1 })

    res.render("pendingVendors", {
      pendingVendors,
      currentPage: "pendingVendors",
    })
    console.log("Vendor document:", pendingVendors)
  } catch (error) {
    console.error("Error fetching pending vendors:", error)
    return res.redirect("/page-error")
  }
}

//Approve vendor
const approveVendor = async (req, res) => {
  try {
    const vendorId = req.params.id

    const vendor = await Vendor.findById(vendorId)

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      })
    }
    // Prevent Multiple approval
    if (vendor.status === "approved") {
      return res.status(400).json({
        success: false,
        message: "Vendor already approved",
      })
    }

    //Approve vendor
    vendor.status = "approved"
    vendor.isApproved = true
    await vendor.save()

    //Send mail after approval
    await sendVendorApprovalMail(vendor.email, vendor.fullName)
    console.log("Vendor approval success & Email sent")

    return res.status(200).json({
      success: true,
      message: "Vendor approved successfully",
    })
  } catch (error) {
    console.error("Error approving vendor:", error)
    return res.status(500).json({
      success: false,
      message: "Error approving vendor",
    })
  }
}

//Get Vendor Details
const getVendorDetails = async (req, res) => {
  try {
    const vendorId = req.params.id

    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      return res.redirect("/page-error")
    }

    const vendor = await Vendor.findById(vendorId)

    if (!vendor) {
      return res.redirect("/page-error")
    }

    // Ensure admin is authenticated 
    if (!req.user || !req.user.id) {
      return res.redirect("/admin/login")
    }

    res.render("vendorDetails", {
      vendor,
    })
  } catch (error) {
    console.error("Error fetching vendor details:", error)
    return res.redirect("/page-error")
  }
}

//Reject vendor
const rejectVendor = async (req, res) => {
  try {
    const vendorId = req.params.id

    const vendor = await Vendor.findById(vendorId)

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      })
    }

    //Block Multiple Vendor rejecting
    if (vendor.status === "rejected") {
      return res.status(400).json({
        success: false,
        message: "Vendor already rejected",
      })
    }

    //Reject vendor
    vendor.status = "rejected"
    vendor.isApproved = false
    vendor.isBlocked = true
    await vendor.save()

    //Send mail after rejection
    await sendVendorRejectionMail(vendor.email, vendor.fullName)
    console.log("Vendor rejection success & Email sent")
    return res.status(200).json({
      success: true,
      message: "Vendor rejected successfully",
    })
  } catch (error) {
    console.error("Error rejecting vendor:", error)
    return res.status(500).json({
      success: false,
      message: "Error rejecting vendor",
    })
  }
}

// Block vendor
const blockVendor = async (req, res) => {
  try {
    const { id } = req.body

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid vendor ID" })
    }

    const vendor = await Vendor.findById(id)
    if (!vendor) {
      return res
        .status(404)
        .json({ success: false, message: "Vendor not found" })
    }

    if (vendor.isBlocked) {
      return res
        .status(400)
        .json({ success: false, message: "Vendor is already blocked" })
    }

    vendor.isBlocked = true
    await vendor.save()

    console.log("Vendor blocked:", id)

    return res.status(200).json({
      success: true,
      message: "Vendor blocked successfully",
    })
  } catch (error) {
    console.error("Error blocking vendor:", error)
    return res.status(500).json({ success: false, message: "Server error" })
  }
}

// Unblock vendor
const unblockVendor = async (req, res) => {
  try {
    const { id } = req.body

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid vendor ID" })
    }

    const vendor = await Vendor.findById(id)
    if (!vendor) {
      return res
        .status(404)
        .json({ success: false, message: "Vendor not found" })
    }

    if (!vendor.isBlocked) {
      return res
        .status(400)
        .json({ success: false, message: "Vendor is already unblocked" })
    }

    vendor.isBlocked = false
    await vendor.save()

    console.log("Vendor unblocked:", id)

    return res.status(200).json({
      success: true,
      message: "Vendor unblocked successfully",
    })
  } catch (error) {
    console.error("Error unblocking vendor:", error)
    return res.status(500).json({ success: false, message: "Server error" })
  }
}
//Load brands
const loadBrands = async (req, res) => {
  try {
    const search = req.query.search || ""
    const page = parseInt(req.query.page) || 1
    const limit = 10
    const skip = (page - 1) * limit

    const query = {}

    if (search) {
      query.name = { $regex: search, $options: "i" }
    }

    const brands = await Brand.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const totalBrands = await Brand.countDocuments(query)
    const totalPages = Math.ceil(totalBrands / limit)

    const hasPrevPage = page > 1
    const hasNextPage = page < totalPages

    res.render("brands", {
      brands,
      currentPage: page,
      totalBrands,
      totalPages,
      hasPrevPage,
      hasNextPage,
      search,
    })
  } catch (error) {
    console.error("Error loading brands:", error)
    res.status(500).render("page-error", { error: "Failed to load brands" })
  }
}

// Add Brand
const addBrand = async (req, res) => {
  try {
    const { name } = req.body

    const existingBrand = await Brand.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    })
    if (existingBrand) {
      return res
        .status(400)
        .json({ success: false, message: "Brand already exists" })
    }

    const brand = new Brand({
      name,
      logo: req.file ? req.file.path : null,
    })

    await brand.save()

    res
      .status(200)
      .json({ success: true, message: "Brand added successfully", brand })
  } catch (error) {
    console.error("Error adding brand:", error)
    res.status(500).json({ success: false, message: "Failed to add brand" })
  }
}

// Edit Brand
const editBrand = async (req, res) => {
  try {
    const { id, name } = req.body

    const brand = await Brand.findById(id)
    if (!brand) {
      return res
        .status(404)
        .json({ success: false, message: "Brand not found" })
    }

    // Check already exists
    if (name && name.toLowerCase() !== brand.name.toLowerCase()) {
      const existingBrand = await Brand.findOne({
        name: { $regex: new RegExp(`^${name}$`, "i") },
        _id: { $ne: id },
      })
      if (existingBrand) {
        return res
          .status(400)
          .json({ success: false, message: "Brand name already exists" })
      }
      brand.name = name
    }

    if (req.file) {
      brand.logo = req.file.path
    }

    await brand.save()

    res
      .status(200)
      .json({ success: true, message: "Brand updated successfully", brand })
  } catch (error) {
    console.error("Error editing brand:", error)
    res.status(500).json({ success: false, message: "Failed to edit brand" })
  }
}

// Toggle Brand Status
const toggleBrandStatus = async (req, res) => {
  try {
    const { id, action } = req.body

    const brand = await Brand.findById(id)
    if (!brand) {
      return res
        .status(404)
        .json({ success: false, message: "Brand not found" })
    }

    brand.isActive = action === "unblock"
    await brand.save()

    res.status(200).json({
      success: true,
      message: `Brand ${action === "unblock" ? "activated" : "deactivated"} successfully`,
    })
  } catch (error) {
    console.error("Error toggling brand status:", error)
    res
      .status(500)
      .json({ success: false, message: "Failed to update brand status" })
  }
}

//Load Cars Management
const loadCarManagement = async (req, res) => {
  try {
    const adminId = req.user.id
    const admin = await User.findById(adminId)

    if (!admin || !admin.isAdmin) {
      return res.redirect("/admin/login")
    }

    const search = req.query.search || ""
    const status = req.query.status || "approved"
    const page = parseInt(req.query.page) || 1
    const limit = 10
    const skip = (page - 1) * limit

    // Build search filter
    const searchFilter = {
      status: status,
    }

    // search
    if (search) {
      searchFilter.$or = [
        { model: { $regex: search, $options: "i" } },
        { registrationNumber: { $regex: search, $options: "i" } },
      ]
    }

    const Car = require("../../models/carSchema")

    const [cars, totalCount, pendingCount, approvedCount, rejectedCount] =
      await Promise.all([
        Car.find(searchFilter)
          .populate("vendorId", "fullName email phone companyName")
          .populate("brand", "name logo")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Car.countDocuments(searchFilter),
        Car.countDocuments({ status: "pending" }),
        Car.countDocuments({ status: "approved" }),
        Car.countDocuments({ status: "rejected" }),
      ])

    const totalPages = Math.ceil(totalCount / limit)

    res.render("carManagement", {
      admin,
      cars,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      search,
      status,
      pendingCount,
      approvedCount,
      rejectedCount,
      totalCount,
    })
  } catch (error) {
    console.error("Car management page error:", error)
    return res.redirect("/page-error")
  }
}

// Get Car Details
const getCarDetails = async (req, res) => {
  try {
    const carId = req.params.id

    if (!mongoose.Types.ObjectId.isValid(carId)) {
      return res.status(400).json({ success: false, message: "Invalid car ID" })
    }

    const Car = require("../../models/carSchema")
    const car = await Car.findById(carId)
      .populate(
        "vendorId",
        "fullName email phone companyName businessAddress taxId businessLicense",
      )
      .populate("brand", "name logo")
      .lean()

    if (!car) {
      return res.status(404).json({ success: false, message: "Car not found" })
    }

    res.render("carDetailsView", { car })
  } catch (error) {
    console.error("Error fetching car details:", error)
    return res.status(500).json({ success: false, message: "Server error" })
  }
}

// Approve Car
const approveCar = async (req, res) => {
  try {
    const carId = req.params.id

    if (!mongoose.Types.ObjectId.isValid(carId)) {
      return res.status(400).json({ success: false, message: "Invalid car ID" })
    }

    const Car = require("../../models/carSchema")

    // Populate vendorId and brand
    const car = await Car.findById(carId)
      .populate("vendorId", "fullName email")
      .populate("brand", "name")

    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Car not found",
      })
    }

    if (car.status === "approved") {
      return res.status(400).json({
        success: false,
        message: "Car already approved",
      })
    }

    if (!car.vendorId) {
      return res.status(404).json({
        success: false,
        message: "Vendor not linked to this car",
      })
    }

    // ✅ Approve car
    car.status = "approved"
    await car.save()

    //Send approval mail
    await sendCarApprovalMail(
      car.vendorId.email,
      car.vendorId.fullName,
      car.brand.name,
      car.model,
    )
    console.log("Car approved and email sent")

    return res.status(200).json({
      success: true,
      message: "Car approved successfully",
    })
  } catch (error) {
    console.error("Error approving car:", error)
    return res.status(500).json({
      success: false,
      message: "Error approving car",
    })
  }
}

// Reject Car
const rejectCar = async (req, res) => {
  try {
    const carId = req.params.id

    if (!mongoose.Types.ObjectId.isValid(carId)) {
      return res.status(400).json({ success: false, message: "Invalid car ID" })
    }

    const Car = require("../../models/carSchema")
    const car = await Car.findById(carId)
      .populate("vendorId", "fullName email")
      .populate("brand", "name")

    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Car not found",
      })
    }

    if (car.status === "rejected") {
      return res.status(400).json({
        success: false,
        message: "Car already rejected",
      })
    }

    car.status = "rejected"
    await car.save()

    //Send rejection mail
    await sendCarRejectionMail(
      car.vendorId.email,
      car.vendorId.fullName,
      car.brand.name,
      car.model,
    )
    console.log("Car rejected and email sent")

    return res.status(200).json({
      success: true,
      message: "Car rejected successfully",
    })
  } catch (error) {
    console.error("Error rejecting car:", error)
    return res.status(500).json({
      success: false,
      message: "Error rejecting car",
    })
  }
}

//Logout
const logout = async (req, res) => {
  try {
    res.clearCookie("admin_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    })
    return res.redirect("/admin/login")
  } catch (error) {
    console.error("Logout error:", error)
    return res.status(500).send("Server error")
  }
}

module.exports = {
  loadLogin,
  pageError,
  login,
  loadDashboard,
  loadUsers,
  getUserDetails,
  customerBlocked,
  customerUnblocked,
  loadBookings,
  loadVendors,
  getPendingVendors,
  approveVendor,
  rejectVendor,
  blockVendor,
  unblockVendor,
  getVendorDetails,
  loadBrands,
  addBrand,
  editBrand,
  toggleBrandStatus,
  loadCarManagement,
  getCarDetails,
  approveCar,
  rejectCar,
  logout,
}
