const mongoose = require("mongoose");

const OtpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  verified: { type: Boolean, default: false },
  meta: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    password: { type: String, required: true }
  }
});

module.exports = mongoose.model("Otp", OtpSchema);
