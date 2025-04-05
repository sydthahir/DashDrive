const mongoose = require("mongoose");
const { Schema } = mongoose;

const tempVendorSchema = new Schema({
    firstName: String,
    lastName: String,
    phone: String,
    email: { type: String, unique: true },
    password: String,
    companyName: String,
    businessAddress: String,
    businessLicense: String,
    taxId: String,
    otp: String,
    expiresAt: Date
},
    {
        createdAt: {
            type: Date,
            default: Date.now,
            expires: 300,
        }
    }

);

const TempVendor = mongoose.model("TempVendor", tempVendorSchema);
module.exports = TempVendor;
