const mongoose = require("mongoose");
const { Schema } = mongoose;

const tempVendorSchema = new Schema({
    fullName: String,
    phone: String,
    email: { type: String, unique: true },
    password: String,
    companyName: String,
    businessAddress: String,
    businessLicense: String,
    documents: String,
    taxId: String,
    documents: {
        businessLicense: {
            url: String,
            public_id: String
        }
    },
    otp: String,
    otpExpiresAt: Date,
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300, // 5 minutes
    }
});

const TempVendor = mongoose.model("TempVendor", tempVendorSchema);
module.exports = TempVendor;
