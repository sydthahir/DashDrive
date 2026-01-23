const car = require("../../models/carSchema")
const Brand = require("../../models/brandModel")
const uploadFile = require("../../middlewares/upload")

//Car registeration form
const loadCarForm = async (req, res) => {
  try {
    const brands = await Brand.find({ isActive: true })
    const Features = ["SportEdition", "Automatic Transmission", "Cruise Control", "Leather Seats"]

    res.render("registerCar", {
      title: "Register New Car",
      brands: brands,
      features: Features,
      daysOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      timeSlots: [
        "9:00 AM - 10:00 AM",
        "10:00 AM - 11:00 AM",
        "11:00 AM - 12:00 PM",
        "12:00 PM - 1:00 PM",
        "2:00 PM - 3:00 PM",
        "3:00 PM - 4:00 PM",
        "4:00 PM - 5:00 PM",
      ],
    })
  } catch (error) {
    console.error("Error loading car form:", error)
    res.redirect("/page-error")
  }
}

//Car registeration
const registerCar = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.redirect(
        "/vendor/register-cars?error=Please upload at least one image",
      )
    }
    const imageUrls = req.files.map((file) => file.path)


    const {
      brand,
      model,
      year,
      registrationNumber,
      color,
      mileage,
      carType,
      fuelType,
      features,
      chargePerSlot,
      securityDeposit,
      availableDays,
      images,
      description,
    } = req.body
    let featuresString = Array.isArray(features) ? features.join(",") : features

    //AvailableDays
    const availableDaysArray = Array.isArray(availableDays)
      ? availableDays
      : [availableDays]

    const newCar = new car({
      vendorId: req.vendor._id,
      brand,
      model,
      year,
      registrationNumber,
      color,
      mileage,
      carType,
      fuelType,
      features: featuresString,
      chargePerSlot,
      securityDeposit,
      availableDays: availableDaysArray,
      description,
      images: imageUrls,
    })

    //Creating new car data on DB
    await newCar.save()
    console.log("car registeration success")

    res.redirect("/vendor/cars?success=Car registered successfully")
  } catch (error) {
    console.error("Error while registering car:", error)
    res.redirect("/page-error")
  }
}

//Car Listing
const listCars = async (req, res) => {
  try {
    // Use req.vendor.id from JWT
    const cars = await car.find({ vendor: req.vendor.id }).populate('brand').lean()
    res.render("vendorCarList", {
      title: "My Cars",
      cars,
      query: req.query,
      activePage: "cars",
      vendor: req.vendor,
    })
  } catch (error) {
    console.error("Error listing cars:", error)
    res.redirect(
      "/page-error?error=" +
      encodeURIComponent(error.message || "Failed to list cars"),
    )
  }
}

module.exports = {
  loadCarForm,
  registerCar,
  listCars,
}
