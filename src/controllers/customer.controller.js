const User = require("../models/user.model")
const Customer = require("../models/customer.model")
const asyncHandler = require("../middleware/async.middleware")
const ErrorResponse = require("../utils/errorResponse")

// 🟢 Đăng ký khách hàng
exports.registerCustomer = asyncHandler(async (req, res, next) => {
  const { fullName, email, phone, password, confirmPassword } = req.body

  if (!fullName || !email || !phone || !password || !confirmPassword) {
    return next(new ErrorResponse("Vui lòng nhập đầy đủ thông tin", 400))
  }

  if (password !== confirmPassword) {
    return next(new ErrorResponse("Mật khẩu xác nhận không khớp", 400))
  }

  const existingUser = await User.findOne({ email })
  if (existingUser) {
    return next(new ErrorResponse("Email đã được sử dụng", 400))
  }

  // ✅ Tạo tài khoản User với role = customer
  const user = await User.create({
    name: fullName,
    email,
    password,
    role: "customer",
  })

  // ✅ Tạo bản ghi Customer liên kết với user
  const customer = await Customer.create({
    user: user._id,
    fullName,
    email,
    phone,
  })

  sendTokenResponse(user, 201, res, customer)
})

// 🟢 Đăng nhập khách hàng
exports.loginCustomer = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body

  if (!email || !password) {
    return next(new ErrorResponse("Vui lòng nhập email và mật khẩu", 400))
  }

  const user = await User.findOne({ email, role: "customer" }).select("+password")
  if (!user) {
    return next(new ErrorResponse("Tài khoản không tồn tại", 404))
  }

  const isMatch = await user.matchPassword(password)
  if (!isMatch) {
    return next(new ErrorResponse("Mật khẩu không đúng", 401))
  }

  const customer = await Customer.findOne({ user: user._id })
  user.lastLogin = Date.now()
  await user.save()

  sendTokenResponse(user, 200, res, customer)
})

// 🟢 Lấy danh sách khách hàng
exports.getCustomers = asyncHandler(async (req, res, next) => {
  const customers = await Customer.find().populate("user", "email role createdAt")
  res.status(200).json({ success: true, count: customers.length, data: customers })
})

// 🟢 Lấy chi tiết khách hàng theo ID
exports.getCustomer = asyncHandler(async (req, res, next) => {
  const customer = await Customer.findById(req.params.id).populate("user", "email role createdAt")

  if (!customer) {
    return next(new ErrorResponse("Không tìm thấy khách hàng", 404))
  }

  res.status(200).json({ success: true, data: customer })
})

// 🔒 Hàm trả token
const sendTokenResponse = (user, statusCode, res, customer) => {
  const token = user.getSignedJwtToken()

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    customer,
  })
}
