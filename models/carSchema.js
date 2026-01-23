const mongoose = require("mongoose")
const { Schema } = mongoose

const carSchema = new Schema(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    brand: {
      type: Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    registrationNumber: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
    mileage: {
      type: String,
      required: true,
    },
    carType: {
      type: String,
      enum: ["Sedan", "SUV", "Hatchback", "Coupe"],
      required: true,
    },
    fuelType: {
      type: String,
      enum: ["Petrol", "Diesel", "Electric", "Hybrid"],
      required: true,
    },
    features: {
      type: String,
      required: false,
    },
    chargePerSlot: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    availability: {
      type: String,
      enum: ["available", "unavailable", "maintenance"],
      default: "available",
    },
    securityDeposit: {
      type: Number,
      required: false,
    },
    availableDays: {
      type: [String],
      required: false,
    },

    images: {
      type: [String],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Car", carSchema)
