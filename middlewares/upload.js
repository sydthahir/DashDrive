
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary")
const cloudinary = require("../config/cloudinary")


//Vendor docs storage(temp)
const vendorDocStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "dashdrive/temp/vendors",
        allowed_formats: ["jpg", "jpeg", "png", "avif", "webp"],
         resource_type: "auto"
    }

})

//Brand logo storage 
const logoStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "dashdrive/logos",
        allowed_formats: ["jpg", "jpeg", "png", "avif", "webp"],
    }

})
//Car image storage
const carStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "dashdrive/cars",
        allowed_formats: ["jpg", "jpeg", "png", "avif", "webp"],
    }

})

//Only Image Files type
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true)
  } else {
    cb(new Error("Only image files are allowed"), false)
  }
}
//Profile Image Storage
const profileStorage = new CloudinaryStorage({
    cloudinary,
    params:{
        folder:"dashdrive/profiles",
        allowed_formats: ["jpg", "jpeg", "png", "avif", "webp"],

    }
})

// Upload middleware for vendor docs
const uploadVendorDocs = multer({
  storage: vendorDocStorage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

//Upload middleware for logos
const uploadBrandLogo = multer({
  storage: carStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});


// Upload middleware for cars
const uploadCarImages = multer({
  storage: carStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

//Upload middleware for profile
const uploadProfileImages = multer({
  storage: profileStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});




module.exports = {
    uploadCarImages,
    uploadVendorDocs,
    uploadBrandLogo,
    uploadProfileImages
}