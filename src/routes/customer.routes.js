const express = require("express")
const router = express.Router()
const {
  registerCustomer,
  loginCustomer,
  getCustomers,
  getCustomer,
} = require("../controllers/customer.controller")
const { protect } = require("../middleware/auth.middleware")

// Đăng ký + đăng nhập
router.post("/register", registerCustomer)
router.post("/login", loginCustomer)

// Quản lý khách hàng (yêu cầu đăng nhập admin/hr)
router.get("/", protect, getCustomers)
router.get("/:id", protect, getCustomer)

module.exports = router
