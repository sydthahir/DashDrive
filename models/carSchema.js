const mongoose = require("mongoose")
const { Schema } = mongoose


const carSchema = new Schema({

    brand: {
        type: String,
        required: true

    },
    model: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    registerationNumber: {
        type: String,
        required: true
    },
    color: {
        type: String,
        required: true

    },
    mileage: {
        type: String,
        required: true
    },
    features: {
        type: String,
        required: true
    },
    chargePerSlot: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: "pendinng"
    },
    availability: {
        type: String,
        enum: ["available", "unavailable", "maintenance"],
        default: "available"
    },
    expiresAt: {
        type: Date,
        required: false
    },
    imageUrl: {
        type: String,
        required: true
    }

},
    {
        timestamps: true
    })









module.exports = mongoose.model("Car", carSchema);

