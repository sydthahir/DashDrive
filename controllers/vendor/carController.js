const car = require("../../models/carSchema")
const Brand = require("../../models/brandModel")
const uploadFile = require("../../middlewares/upload")
const mongoose = require("mongoose");

//Car registeration form
const loadCarForm = async (req, res) => {
  try {
    const brands = await Brand.find({ isActive: true })
    const Features = ["Sport Edition", "Automatic Transmission", "Cruise Control", "Leather Seats"]

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

      activePage: "cars",
      vendor: req.vendor,
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
        "/vendor/cars/register-cars?error=Please upload at least one image",
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
    const vendorId = new mongoose.Types.ObjectId(req.vendor._id);

    // Find cars belonging to this vendor
    const cars = await car.find({
      vendorId: vendorId,
      isDeleted: { $ne: true }
    }).populate('brand').lean();
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

//View Car Details
const viewCarDetails = async (req, res) => {
  try {
    const carId = req.params.id;
    const vendorId = req.vendor._id;

    const carDetails = await car.findOne({ _id: carId, vendorId: vendorId }).populate('brand').lean();

    if (!carDetails) {
      return res.redirect("/vendor/cars?error=Car not found");
    }

    res.render("vendorCarDetails", {
      title: `${carDetails.model} - Details`,
      activePage: "cars",
      vendor: req.vendor,
      car: carDetails
    });

  } catch (error) {
    console.error("Error viewing car details:", error);
    res.redirect("/vendor/cars?error=Something went wrong");
  }
}

// Soft Delete Car
const deleteCar = async (req, res) => {
  try {
    const carId = req.params.id;
    const vendorId = req.vendor._id;

    const deletedCar = await car.findOneAndUpdate(
      { _id: carId, vendorId: vendorId },
      { isDeleted: true },
      { new: true }
    );

    if (!deletedCar) {
      return res.status(404).json({ success: false, message: "Car not found or unauthorized" });
    }

    return res.json({ success: true, message: "Car deleted successfully" });
  } catch (error) {
    console.error("Error deleting car:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// Load Edit Car Form
const loadEditCarForm = async (req, res) => {
  try {
    const carId = req.params.id;
    const vendorId = req.vendor._id;

    const carData = await car.findOne({ _id: carId, vendorId: vendorId }).populate('brand').lean();

    if (!carData) {
      return res.redirect("/vendor/cars?error=Car not found");
    }

    const brands = await Brand.find({ isActive: true });
    const Features = ["SportEdition", "Automatic Transmission", "Cruise Control", "Leather Seats"];

    res.render("editCar", {
      title: "Edit Car",
      car: carData,
      brands: brands,
      features: Features,
      activePage: "cars",
      vendor: req.vendor,
      daysOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    });
  } catch (error) {
    console.error("Error loading edit form:", error);
    res.redirect("/page-error");
  }
}

// Update Car
const updateCar = async (req, res) => {
  try {
    const carId = req.params.id;
    const vendorId = req.vendor._id;

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
      description,
    } = req.body;

    const updateData = {
      brand,
      model,
      year,
      registrationNumber,
      color,
      mileage,
      carType,
      fuelType,
      features: Array.isArray(features) ? features.join(",") : features,
      chargePerSlot,
      securityDeposit,
      availableDays: Array.isArray(availableDays) ? availableDays : [availableDays],
      description,
    };

    // Handle images - combine existing (not removed) with new uploads
    const existingImagesToKeep = req.body.existingImages
      ? (Array.isArray(req.body.existingImages)
        ? req.body.existingImages.filter(img => img && img.trim() !== '')
        : [req.body.existingImages].filter(img => img && img.trim() !== ''))
      : [];

    const newImages = req.files && req.files.length > 0
      ? req.files.map((file) => file.path)
      : [];

    // Combine existing images (that weren't removed) with new uploads (max 5 total)
    updateData.images = [...existingImagesToKeep, ...newImages].slice(0, 5);

    const updatedCar = await car.findOneAndUpdate(
      { _id: carId, vendorId: vendorId },
      updateData,
      { new: true }
    );

    if (!updatedCar) {
      return res.redirect("/vendor/cars?error=Car not found or unauthorized");
    }

    res.redirect("/vendor/cars?success=Car updated successfully");
  } catch (error) {
    console.error("Error updating car:", error);
    res.redirect("/page-error");
  }
}

module.exports = {
  loadCarForm,
  registerCar,
  listCars,
  deleteCar,
  viewCarDetails,
  loadEditCarForm,
  updateCar
}
