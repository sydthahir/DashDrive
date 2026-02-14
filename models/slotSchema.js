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
    startTime: String, // "10:00"
    endTime: String,   // "12:00"
    status: {
        type: String,
        enum: ["available", "maintenance", "booked"],
        default: "available"
    }
}, { timestamps: true });
slotSchema.index(
  { carId: 1, date: 1, startTime: 1, endTime: 1 },
  { unique: true }
);


module.exports = mongoose.model("Slot", slotSchema);
