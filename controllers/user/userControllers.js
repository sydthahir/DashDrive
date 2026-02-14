const User = require("../../models/userSchema")
const TempUser = require("../../models/tempUserSchema")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const env = require("dotenv").config()
const generateOTP = require("../../utils/otpGenerator")
const { sendOtpMail } = require("../../utils/mailer")
const { securePassword } = require("../../utils/hashPassword")
const { name } = require("ejs")

//Load Page-not-found
const pageNotFound = async (req, res) => {
  try {
    res.status(404).render("page-404", {
      message: "Page not found",
      error: null,
    })
  } catch (error) {
    console.error("Error rendering 404 page:", error)
    res.status(500).send("Internal Server Error") // For critical errors
  }
}

//Loading of landing page

const loadLandingPage = async (req, res) => {
  try {
    if (req.cookies.user_token) {
      return res.redirect("/home")
    }
    return res.render("landingPage")
  } catch (error) {
    console.log("page not found")
    res.redirect("/pageNotFound")
  }
}

//Load Signup page
const loadSignup = async (req, res) => {
  try {
    return res.render("signup")
  } catch (error) {
    console.log("Signup page is not found")
    res.redirect("/pageNotFound")
  }
}

//User registration
const signup = async (req, res) => {
  try {
    const { name, email, password, confirm_password } = req.body

    //Fields Required
    if (!name || !email || !password || !confirm_password) {
      return res.render("signup", {
        message: "All fields are required",
      })
    }

    //Password matching check
    if (password !== confirm_password) {
      return res.render("signup", { message: "Password does not match" })
    }

    //Password hashing
    const hashedPassword = await securePassword(password)


    const findUser = await User.findOne({ email })
    if (findUser) {
      console.log("user exists")
      return res.render("signup", {
        message: "User with these email already exists",
      })
    }

    //Generate OTP
    var otp = generateOTP()
    const hashedOtp = await bcrypt.hash(otp.toString(), 10)

    // Temporarily store registration data
    const tempData = {
      name,
      email,
      password: hashedPassword,
      otp: hashedOtp,
      expiresAt: Date.now() + 5 * 60 * 1000, //5 minute expiration
    }

    //Checks duplicate TempUser
    const existingTempData = await TempUser.findOne({ email })
    if (existingTempData) {
      await TempUser.deleteOne({ email })
    }

    await TempUser.create(tempData)

    //Send email
    const emailSent = await sendOtpMail(email, otp)
    if (!emailSent) {
      return res.render("signup", {
        message: "Error sending verification email",
      })
    }

    res.render("verify-otp", {
      email: tempData.email,
      message: null,
      userType: 'user',
      redirectUrl: '/login'
    })
    console.log("OTP is:", otp)

  } catch (error) {
    console.error("Error while creating user account", error)
    res.redirect("/pageNotFound")
  }
}

//Verification of OTP
const verifyOTP = async (req, res) => {
  try {
    const { otp, email } = req.body

    console.log("entered otp", otp)

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      })
    }

    // Find temporary data by email
    const tempData = await TempUser.findOne({ email: email.toLowerCase() })
    if (!tempData) {
      console.log("TempData not found for email:", email)
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      })
    }
    // Expiry check
    if (Date.now() > tempData.otpExpiresAt) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      })
    }

    // OTP comparison
    const otpCheck = await bcrypt.compare(otp.toString(), tempData.otp)
    if (!otpCheck) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      })
    }


    //Create new user on DB
    const newUser = new User({
      name: tempData.name,
      email: tempData.email,
      password: tempData.password,
    })

    await newUser.save()
    console.log("New User created")

    // Delete temporary data
    await TempUser.deleteOne({ email })

    return res.status(200).json({
      success: true,
      message: "Account created successfully",
    })
  } catch (error) {
    console.error("Error verifying OTP:", error.message)
    return res.status(500).json({
      success: false,
      message: "An error occurred while verifying OTP. Please try again.",
    })
  }
}

//Otp resending
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required to resend OTP",
      })
    }

    const tempData = await TempUser.findOne({ email })
    if (!tempData) {
      return res.status(400).json({
        success: false,
        message: "No pending registration found for this email",
      })
    }

    const newOTP = generateOTP()

    const emailSent = await sendOtpMail(email, newOTP)
    if (!emailSent) {
      return res.render("signup", {
        message: "Error sending verification email",
      })
    }

    tempData.otp = newOTP
    tempData.expiresAt = Date.now() + 10 * 60 * 1000 // Reset expiration
    await tempData.save()

    console.log("resent OTP is :", newOTP)
    return res.status(200).json({
      success: true,
      message: "OTP resent successfully",
    })
  } catch (error) {
    console.error("Error resending OTP:", error.message)
    return res.status(500).json({
      success: false,
      message: "An error occurred while resending OTP.",
    })
  }
}

//loading of Login page
const loadLogin = (req, res) => {
  try {
    const message = req.query.message || ''
    if (req.cookies.user_token) {
      return res.redirect("/home")
    }

    res.render("login", { message })
  } catch (error) {
    console.log("Login page error:", error)
    res.status(500).send("Server Error")
  }
}

//Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res
        .status(400)
        .render("login", { message: "Email and password are required" })
    }

    const findUser = await User.findOne({ isAdmin: 0, email: email })
    if (!findUser) {
      return res.status(404).render("login", { message: "User not found" })
    }

    if (findUser.isBlocked) {
      return res
        .status(403)
        .render("login", { message: "Your account is blocked" })
    }

    const passwordMatch = await bcrypt.compare(password, findUser.password)
    if (!passwordMatch) {
      return res
        .status(401)
        .render("login", { message: "Incorrect Email or Password" })
    }

    //Generating JWT token
    const token = jwt.sign(
      { userId: findUser._id, email: findUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    )
    console.log("jwt Token Generated")

    res.cookie("user_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600000,
      sameSite: "strict",
    })

    return res.redirect("/home")
  } catch (error) {
    console.error("Login error:", error)
    return res
      .status(500)
      .render("login", { message: "An error occurred. Please try again." })
  }
}

// Load homepage
const loadHomepage = async (req, res) => {
  try {
    return res.render("home")
  } catch (error) {
    console.log("page not found")
    return res.status(500).send("Server error")
  }
}

//Loading of profile page
const profile = async (req, res) => {
  try {
    const user = req.user
    const Booking = require("../../models/bookingSchema")

    if (!user) {
      console.log("User not found in database")
      return res
        .status(401)
        .redirect("/login?message=Please log in to view your profile")
    }

    // Fetch user bookings with car and vendor details
    const bookings = await Booking.find({ userId: user._id })
      .populate({
        path: "carId",
        select: "model brand images carType",
        populate: {
          path: "brand",
          select: "name"
        }
      })
      .populate("vendorId", "businessName")
      .sort({ createdAt: -1 })
      .lean()

    const wallet = { balance: user.walletBalance || 0 }
    const transactions = []
    const totalBookings = bookings.length

    return res.render("profile", {
      user: {
        name: user.name || "Unknown",
        email: user.email || "N/A",
        phone: user.phone || "N/A",
        address: user.address || {
          street: "N/A",
          city: "N/A",
          state: "N/A",
          pincode: "N/A",
          country: "N/A",
        },
        memberSince: user.createdAt
          ? user.createdAt.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
          : "N/A",
      },
      wallet,
      transactions,
      totalBookings,
      bookings,
    })
  } catch (error) {
    console.error("Error loading profile:", error)
    res.status(500).send("Server error")
  }
}

const editUserProfile = async (req, res) => {
  try {
    // Verify user authentication
    if (!req.user || !req.user._id) {
      console.log("No user found in req.user")
      return res
        .status(401)
        .redirect("/login?message=Please log in to edit your profile")
    }

    // Log for debugging
    console.log("Request body:", req.body)

    // Validating input
    const { name, email, phone, address } = req.body

    if (
      !name ||
      !email ||
      !phone ||
      !address ||
      !address.street ||
      !address.city ||
      !address.state ||
      !address.pincode ||
      !address.country
    ) {
      return res.render("profile", {
        user: {
          name: req.user.name || "Unknown",
          email: req.user.email || "N/A",
          phone: req.user.phone || "N/A",
          address: req.user.address || {
            street: "N/A",
            city: "N/A",
            state: "N/A",
            pincode: "N/A",
            country: "N/A",
          },
          memberSince: req.user.createdAt
            ? req.user.createdAt.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
            : "N/A",
        },
        wallet: { balance: req.user.walletBalance || 0 },
        transactions: [],
        totalBookings: 0,
        bookings: [],
        message: "All fields are required",
      })
    }

    // Check duplicate email or phone
    const duplicateUser = await User.findOne({
      _id: { $ne: req.user._id },
      $or: [{ email: email }, { phone: phone }],
    })

    if (duplicateUser) {
      let message = "Duplicate data found"

      if (duplicateUser.email === email) {
        message = "Email already exists"
      } else if (duplicateUser.phone === phone) {
        message = "Phone number already exists"
      }
      return res.render("profile", {
        user: {
          name: req.user.name,
          email: req.user.email,
          phone: req.user.phone,
          address: req.user.address,
          memberSince: req.user.createdAt.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        },
        wallet: { balance: req.user.walletBalance || 0 },
        transactions: [],
        totalBookings: 0,
        bookings: [],
        message,
      })
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        name,
        email,
        phone,
        address: {
          street: address.street,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          country: address.country,
        },
      },
      { new: true, runValidators: true },
    )

    if (!updatedUser) {
      console.log("User not found in database:", req.user._id)
      return res.render("profile", {
        user: {
          name: req.user.name || "Unknown",
          email: req.user.email || "N/A",
          phone: req.user.phone || "N/A",
          address: req.user.address || {
            street: "N/A",
            city: "N/A",
            state: "N/A",
            pincode: "N/A",
            country: "N/A",
          },
          memberSince: req.user.createdAt
            ? req.user.createdAt.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
            : "N/A",
        },
        wallet: { balance: req.user.walletBalance || 0 },
        transactions: [],
        totalBookings: 0,
        bookings: [],
        message: "User not found",
      })
    }

    // Render profile with updated data
    return res.render("profile", {
      user: {
        name: updatedUser.name || "Unknown",
        email: updatedUser.email || "N/A",
        phone: updatedUser.phone || "N/A",
        address: updatedUser.address || {
          street: "N/A",
          city: "N/A",
          state: "N/A",
          pincode: "N/A",
          country: "N/A",
        },
        memberSince: updatedUser.createdAt
          ? updatedUser.createdAt.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
          : "N/A",
      },
      wallet: { balance: updatedUser.walletBalance || 0 },
      transactions: [],
      totalBookings: 0,
      bookings: [],
      message: "Profile updated successfully",
    })
  } catch (error) {
    console.error("Error updating profile:", error)
    if (error.code === 11000) {
      // Duplicate key error (e.g., email already exists)
      return res.render("profile", {
        user: {
          name: req.user.name || "Unknown",
          email: req.user.email || "N/A",
          phone: req.user.phone || "N/A",
          address: req.user.address || {
            street: "N/A",
            city: "N/A",
            state: "N/A",
            pincode: "N/A",
            country: "N/A",
          },
          memberSince: req.user.createdAt
            ? req.user.createdAt.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
            : "N/A",
        },
        wallet: { balance: req.user.walletBalance || 0 },
        transactions: [],
        totalBookings: 0,
        bookings: [],
        message: "Email is already in use",
      })
    }
    return res.render("profile", {
      user: {
        name: req.user.name || "Unknown",
        email: req.user.email || "N/A",
        phone: req.user.phone || "N/A",
        address: req.user.address || {
          street: "N/A",
          city: "N/A",
          state: "N/A",
          pincode: "N/A",
          country: "N/A",
        },
        memberSince: req.user.createdAt
          ? req.user.createdAt.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
          : "N/A",
      },
      wallet: { balance: req.user.walletBalance || 0 },
      transactions: [],
      totalBookings: 0,
      bookings: [],
      message: "Server error: Unable to update profile",
    })
  }
}

//Loading of cars page
const loadCarsPage = async (req, res) => {
  try {
    return res.render("cars")
  } catch (error) {
    console.log("cars page not found")
    res.status(500).send("Server Error")
  }
}

//Loading of services page
const loadServices = async (req, res) => {
  try {
    return res.render("services")
  } catch (error) {
    console.log("Services page not found")
    res.status(500).send("Server Error")
  }
}

//Loading of listing cars page
const loadListings = async (req, res) => {
  try {
    const Car = require("../../models/carSchema")
    const Brand = require("../../models/brandSchema")

    const { search, brand, fuel, sort, category } = req.query


    // Pagination Setup
    const page = parseInt(req.query.page) || 1
    const limit = 6
    const skip = (page - 1) * limit


    // Build query object
    const query = {
      status: "approved",
      availability: "available",
    }

    if (brand) {
      query.brand = brand
    }

    if (fuel) {
      query.fuelType = fuel
    }

    if (category) {
      query.carType = category
    }

    if (search) {
      const searchRegex = new RegExp(search, "i")

      // Find matching brands first
      const matchedBrands = await Brand.find({ name: searchRegex }).select("_id")
      const matchedBrandIds = matchedBrands.map(b => b._id)

      query.$or = [
        { model: searchRegex },
        { brand: { $in: matchedBrandIds } }
      ]
    }


    // Determine sort order
    let sortOptions = { createdAt: -1 } // Default: Newest
    let collation = null

    if (sort === "price_low") {
      sortOptions = { chargePerSlot: 1 }
      collation = { locale: "en", numericOrdering: true } // Handle string number sorting
    } else if (sort === "price_high") {
      sortOptions = { chargePerSlot: -1 }
      collation = { locale: "en", numericOrdering: true }
    } else if (sort === "newest") {
      sortOptions = { createdAt: -1 }
    }

    let carsQuery = Car.find(query)
      .populate("brand", "name logo")
      .populate("vendorId", "businessName")

    if (collation) {
      carsQuery = carsQuery.collation(collation)
    }

    // Count total results
    const totalCars = await Car.countDocuments(query)
    const totalPages = Math.ceil(totalCars / limit)

    const cars = await carsQuery
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean()
    // Get all active brands
    const brands = await Brand.find({ isActive: true }).sort({ name: 1 }).lean()

    return res.render("listings", {
      cars,
      brands,
      query: req.query,
      currentPage: page,
      totalPages
    })
  } catch (error) {
    console.log("Error loading listings page:", error)
    res.status(500).send("Server Error")
  }
}

//Loading of single car details page
const loadCarDetails = async (req, res) => {
  try {
    const Car = require("../../models/carSchema")
    const { id } = req.params

    const car = await Car.findById(id)
      .populate("brand", "name logo")
      .populate("vendorId", "businessName address")
      .lean()

    if (!car) {
      return res.status(404).render("page-404", { message: "Car not found", error: null })
    }

    // Fetch similar cars (same carType, excluding current car)
    const similarCars = await Car.find({
      carType: car.carType,
      _id: { $ne: car._id },
      status: "approved",
      availability: "available"
    })
      .limit(4)
      .populate("brand", "name")
      .lean()

    return res.render("carDetails", { car, similarCars })
  } catch (error) {
    console.error("Error loading car details:", error)
    // If invalid ID format or other error
    res.status(500).render("page-404", { message: "Error loading car details", error: null })
  }
}

//Loading of contact page
const loadContact = async (req, res) => {
  try {
    return res.render("contact")
  } catch (error) {
    console.log("listings page not found")
    res.status(500).send("Server Error")
  }
}

//loading of About Us
const loadAbout = async (req, res) => {
  try {
    return res.render("about")
  } catch (error) {
    console.log("about Us page not found")
    res.status(500).send("Server Error")
  }
}

//Logout
const logout = async (req, res) => {
  try {
    // Clear the user_token cookie
    res.clearCookie("user_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    })
    res.redirect("/login")
    console.log("logout successful")
  } catch (error) {
    console.error("Logout error:", error)
    res.status(500).send("Server error")
  }
}

module.exports = {
  loadLandingPage,
  loadHomepage,
  loadSignup,
  signup,
  verifyOTP,
  resendOTP,
  pageNotFound,
  loadLogin,
  login,
  loadCarsPage,
  profile,
  editUserProfile,
  loadListings,
  loadCarDetails,
  loadServices,
  loadContact,
  loadAbout,
  logout,
}
