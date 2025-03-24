const mongoose = require("mongoose")
const { Schema } = mongoose;


const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    password: {
        type: String,
        required: false

    },
    phone: {
        type: String,
        unique: true,
        sparse: true
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    wallet: {
        type: Schema.Types.ObjectId,
        ref: "walletTransactions"
    },
    bookingsDetails: {
        type: Schema.Types.ObjectId,
        ref: "bookings"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }


})


const User = mongoose.model("User", userSchema)
module.exports = User