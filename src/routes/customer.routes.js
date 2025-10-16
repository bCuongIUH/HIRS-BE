const express = require("express");
const router = express.Router();
const {
  sendOtpForRegistration,
  verifyOtpAndRegister,
  loginCustomer,
  addAddress,
  getActiveAddresses,
  updateAddress,
  softDeleteAddress,
} = require("../controllers/customer.controller");

router.post("/send-otp", sendOtpForRegistration);      // Bước 1: gửi OTP
router.post("/verify-otp", verifyOtpAndRegister);       // Bước 2: xác thực OTP
router.post("/login", loginCustomer);                  // Đăng nhập
// 🔹 Thêm địa chỉ mới
router.post("/add-address", addAddress)

// 🔹 Lấy danh sách địa chỉ chưa bị ẩn
router.get("/:customerId/addresses",getActiveAddresses)

// 🔹 Cập nhật địa chỉ
router.put("/update-address", updateAddress)

// 🔹 Xóa địa chỉ (soft delete)
router.put("/soft-delete-address", softDeleteAddress)

module.exports = router;
