const User = require("../models/user.model")
const Employee = require("../models/employee.model")
const asyncHandler = require("../middleware/async.middleware")
const ErrorResponse = require("../utils/errorResponse")
const crypto = require("crypto")
const nodemailer = require("nodemailer")

// Hàm tạo mật khẩu ngẫu nhiên
const generateRandomPassword = (length = 10) => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+"
  let password = ""
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length)
    password += charset[randomIndex]
  }
  return password
}

// @desc    Đăng nhập người dùng
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse("Vui lòng cung cấp email và mật khẩu", 400))
  }

  // Kiểm tra người dùng
  const user = await User.findOne({ email }).select("+password")

  if (!user) {
    return next(new ErrorResponse("Thông tin đăng nhập không hợp lệ", 401))
  }

  // Kiểm tra mật khẩu
  const isMatch = await user.matchPassword(password)

  if (!isMatch) {
    return next(new ErrorResponse("Thông tin đăng nhập không hợp lệ", 401))
  }
 // Kiểm tra trạng thái isDelete
  if (user.isDelete === "true") {
    return next(new ErrorResponse("Tài khoản của bạn đã bị xóa.", 401));
  }
  // Cập nhật thời gian đăng nhập cuối
  user.lastLogin = Date.now()
  await user.save({ validateBeforeSave: false })

  // Lấy thông tin nhân viên nếu là nhân viên
  let employeeData = null
  if (user.role === "employee") {
    const employee = await Employee.findOne({ user: user._id })
    if (employee) {
      employeeData = {
        id: employee._id,
        employeeId: employee.employeeId,
        fullName: `${employee.firstName} ${employee.lastName}`,
        position: employee.position,
        // department: employee.department ? employee.department.name : "",
        avatar: employee.avatar,
      }
    }
  }

  sendTokenResponse(user, 200, res, employeeData)
})

// @desc    Đăng xuất người dùng / xóa cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  })

  res.status(200).json({
    success: true,
    data: {},
  })
})

// @desc    Lấy thông tin người dùng hiện tại
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id)

  // Lấy thông tin nhân viên nếu là nhân viên
  let employeeData = null
  if (user.role === "employee") {
    const employee = await Employee.findOne({ user: user._id })
    if (employee) {
      employeeData = {
        id: employee._id,
        employeeId: employee.employeeId,
        fullName: `${employee.firstName} ${employee.lastName}`,
        position: employee.position,
        // department: employee.department ? employee.department.name : "",
        avatar: employee.avatar,
      }
    }
  }

  res.status(200).json({
    success: true,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin,
      employee: employeeData,
    },
  })
})

// @desc    Quên mật khẩu - Tạo mật khẩu mới và gửi qua email
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  console.log("Received forgot password request:", req.body)

  const user = await User.findOne({ email: req.body.email })

  if (!user) {
    return next(new ErrorResponse("Không tìm thấy người dùng với email này", 404))
  }

  // Tạo mật khẩu ngẫu nhiên
  const newPassword = generateRandomPassword(12)

  // Cập nhật mật khẩu mới cho người dùng
  user.password = newPassword
  await user.save()

  // Tạo nội dung email
  const message = `
    Xin chào ${user.name},
    
    Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.
    
    Mật khẩu mới của bạn là: ${newPassword}
    
    Vui lòng đăng nhập với mật khẩu mới này và đổi mật khẩu ngay sau khi đăng nhập để đảm bảo an toàn.
    
    Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng liên hệ với quản trị viên ngay lập tức.
    
    Trân trọng,
    Đội ngũ KT.BookStore
  `

  try {
    // Kiểm tra cấu hình email
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com"
    const smtpPort = process.env.SMTP_PORT || 587
    const smtpUser = process.env.SMTP_EMAIL
    const smtpPass = process.env.SMTP_PASSWORD

    if (!smtpUser || !smtpPass) {
      console.error("SMTP_EMAIL hoặc SMTP_PASSWORD không được cấu hình")
      return next(new ErrorResponse("Cấu hình email chưa được thiết lập. Vui lòng liên hệ quản trị viên.", 500))
    }

    console.log("SMTP Config:", {
      host: smtpHost,
      port: smtpPort,
      auth: {
        user: smtpUser,
        pass: "******", // Ẩn mật khẩu trong log
      },
    })

    // Tạo transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })

    // Cấu hình email
    const mailOptions = {
      from: `${process.env.FROM_NAME || "HRIS System"} <${process.env.FROM_EMAIL || smtpUser}>`,
      to: user.email,
      subject: "Mật khẩu mới cho tài khoản của bạn",
      text: message,
    }

    console.log("Sending email to:", user.email)

    // Gửi email
    await transporter.sendMail(mailOptions)
    console.log("Email sent successfully")

    res.status(200).json({
      success: true,
      data: "Mật khẩu mới đã được gửi đến email của bạn",
    })
  } catch (err) {
    console.error("Lỗi gửi email:", err)

    // Khôi phục mật khẩu cũ nếu gửi email thất bại
    user.password = req.body.oldPassword
    await user.save({ validateBeforeSave: false })

    return next(new ErrorResponse(`Không thể gửi email: ${err.message}`, 500))
  }
})

// @desc    Cập nhật thông tin người dùng
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
  }

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  })

  res.status(200).json({
    success: true,
    data: user,
  })
})

// @desc    Cập nhật mật khẩu
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password")

  // Kiểm tra mật khẩu hiện tại
  const isMatch = await user.matchPassword(req.body.currentPassword)

  if (!isMatch) {
    return next(new ErrorResponse("Mật khẩu hiện tại không chính xác", 401))
  }

  user.password = req.body.newPassword
  await user.save()

  sendTokenResponse(user, 200, res)
})

// Hàm hỗ trợ gửi token trong cookie và response
const sendTokenResponse = (user, statusCode, res, employeeData = null) => {
  // Tạo token
  const token = user.getSignedJwtToken()

  const options = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true,
  }

  // Bảo mật cookie trong production
  if (process.env.NODE_ENV === "production") {
    options.secure = true
  }

  // Loại bỏ mật khẩu từ response
  user.password = undefined

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employee: employeeData,
      },
    })
}
