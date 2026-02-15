const mongoose = require("mongoose");
const { Schema } = mongoose;

const bookingSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
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
    slotId: {
        type: Schema.Types.ObjectId,
        ref: "Slot",
        required: false,
    },
    bookingDate: {
        type: Date,
        required: true,
    },
    startTime: {
        type: String,
        required: true,
    },
    endTime: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: false,
    },
    status: {
        type: String,
        enum: ["initiated", "confirmed", "cancelled", "completed", "no-show"],
        default: "initiated"
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed"],
        default: "pending"
    },
    pickupLocation: {
        type: String,
        required: true
    },
    contactNumber: {
        type: String,
        required: true
    },
    specialRequests: {
        type: String,
        default: ""
    },
     cancellationReason: {
        type: String,
        default: ""
    }

}, { timestamps: true });




module.exports = mongoose.model("Booking", bookingSchema);
