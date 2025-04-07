const mongoose = require("mongoose")
const { Schema } = mongoose;


const vendorSchema = new Schema({

    firstName: {
        type: String,
        required: true
    },

    lastName: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
    },

    password: {
        type: String,
        required: true

    },
    phone: {
        type: String,
        required: true,
        unique: true,

    },
    companyName: {
        type: String,
        required: true
    },

    businessAddress: {
        type: String,
        required: true
    },

    businessLicense: {
        type: String,

    },
    taxId: {
        type: String,
        required: true

    },
    documentUrl: {
        type: String,
        required: false

    },
    isApproved: {
        type: Boolean,
        default: false
    },
    status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'inactive' },
    otp: {
        type: String,
        required: false
    },
    resetOTP: String,          
    resetOTPExpiry: Date,

    expiresAt: {
        type: Date,
        required: false
    }

},
    {
        timestamps: true
    })










const Vendor = mongoose.model("Vendor", vendorSchema)
module.exports = Vendor