const mongoose = require("mongoose");
const { Schema } = mongoose;


const tempUserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    otp: String,
    resetOTP: String,          
    resetOTPExpiry: Date,
    createdAt: { type: Date, default: Date.now, expires: 300 } // expires after 5 mins
})

module.exports = mongoose.model('TempUser', tempUserSchema)