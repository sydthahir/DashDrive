const mongoose = require("mongoose");
const { Schema } = mongoose;


const tempUserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,

    otp: String,
    otpExpiresAt: Date,

    resetOTP: String,
    resetOTPExpiry: Date,
}, { timestamps: true });

tempUserSchema.index(
  { otpExpiresAt: 1 },
  { expireAfterSeconds: 0 }
);

module.exports = mongoose.model('TempUser', tempUserSchema)