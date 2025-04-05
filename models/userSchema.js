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
    address: {
        street: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        pincode: { type: String, default: '' },
        country: { type: String, default: '' }
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    walletBalance: {
        type: Number,
        default: 0
    },
    wallet: {
        type: Schema.Types.ObjectId,
        ref: "walletTransactions"
    },
    bookingsDetails: {
        type: Schema.Types.ObjectId,
        ref: "bookings"
    }
},
    {
        timestamps: true,


    })




    
const User = mongoose.model("User", userSchema)
module.exports = User