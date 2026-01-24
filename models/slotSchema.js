const mongoose = require("mongoose");
const { Schema } = mongoose;

const slotSchema = new Schema({
    carId: {
        type: Schema.Types.ObjectId,
        ref: "Car",
        required: true,
    },
    vendorId: {
        type: Schema.Types.ObjectId,
        ref: "Vendor",
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    startTime: {
        type: String, // e.g., "10:00"
        required: true,
    },
    endTime: {
        type: String, // e.g., "11:00"
        required: true,
    },
    isBooked: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ["available", "maintenance", "booked"],
        default: "available",
    },
}, { timestamps: true });

module.exports = mongoose.model("Slot", slotSchema);
