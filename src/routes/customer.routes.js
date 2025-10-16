const express = require("express");
const router = express.Router();
const {
  sendOtpForRegistration,
  verifyOtpAndRegister,
  loginCustomer,
} = require("../controllers/customer.controller");

router.post("/send-otp", sendOtpForRegistration);      // Bước 1: gửi OTP
router.post("/verify-otp", verifyOtpAndRegister);       // Bước 2: xác thực OTP
router.post("/login", loginCustomer);                  // Đăng nhập

module.exports = router;
