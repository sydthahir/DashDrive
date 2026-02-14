const mongoose = require("mongoose")
const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    logo: {
      type: String,
      required: false
    }
  },
  { timestamps: true },
)



module.exports = mongoose.model("Brand", brandSchema);
