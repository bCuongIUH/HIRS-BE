const User = require("../models/user.model")
const Employee = require("../models/employee.model")
const asyncHandler = require("../middleware/async.middleware")
const ErrorResponse = require("../utils/errorResponse")
const crypto = require("crypto")
const nodemailer = require("nodemailer")

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

  // Cập nhật thời gian đăng nhập cuối
  user.lastLogin = Date.now()
  await user.save({ validateBeforeSave: false })

  // Lấy thông tin nhân viên nếu là nhân viên
  let employeeData = null
  if (user.role === "employee") {
    const employee = await Employee.findOne({ user: user._id }).populate("department", "name")
    if (employee) {
      employeeData = {
        id: employee._id,
        employeeId: employee.employeeId,
        fullName: `${employee.firstName} ${employee.lastName}`,
        position: employee.position,
        department: employee.department ? employee.department.name : "",
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
    sameSite: "None",
    secure: process.env.NODE_ENV === "production",
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
    const employee = await Employee.findOne({ user: user._id }).populate("department", "name")
    if (employee) {
      employeeData = {
        id: employee._id,
        employeeId: employee.employeeId,
        fullName: `${employee.firstName} ${employee.lastName}`,
        position: employee.position,
        department: employee.department ? employee.department.name : "",
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

// @desc    Quên mật khẩu
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email })

  if (!user) {
    return next(new ErrorResponse("Không tìm thấy người dùng với email này", 404))
  }

  // Tạo token đặt lại mật khẩu
  const resetToken = user.getResetPasswordToken()

  await user.save({ validateBeforeSave: false })

  // Tạo URL đặt lại mật khẩu
  const resetUrl = `${req.protocol}://${req.get("host")}/reset-password/${resetToken}`

  const message = `
    Bạn nhận được email này vì bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu. Vui lòng nhấp vào liên kết sau để đặt lại mật khẩu của bạn:
    \n\n${resetUrl}\n\n
    Liên kết này sẽ hết hạn sau 10 phút.
    \n\n
    Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
  `

  try {
    // Tạo transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.mailtrap.io",
      port: process.env.SMTP_PORT || 2525,
      auth: {
        user: process.env.SMTP_EMAIL || "your-mailtrap-user",
        pass: process.env.SMTP_PASSWORD || "your-mailtrap-password",
      },
    })

    // Cấu hình email
    const mailOptions = {
      from: `${process.env.FROM_NAME || "HRIS System"} <${process.env.FROM_EMAIL || "noreply@hris.com"}>`,
      to: user.email,
      subject: "Đặt lại mật khẩu",
      text: message,
    }

    // Gửi email
    await transporter.sendMail(mailOptions)

    res.status(200).json({
      success: true,
      data: "Email đã được gửi",
    })
  } catch (err) {
    console.log(err)
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined

    await user.save({ validateBeforeSave: false })

    return next(new ErrorResponse("Không thể gửi email", 500))
  }
})

// @desc    Đặt lại mật khẩu
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Lấy token từ params
  const resetPasswordToken = crypto.createHash("sha256").update(req.params.resettoken).digest("hex")

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  })

  if (!user) {
    return next(new ErrorResponse("Token không hợp lệ hoặc đã hết hạn", 400))
  }

  // Đặt mật khẩu mới
  user.password = req.body.password
  user.resetPasswordToken = undefined
  user.resetPasswordExpire = undefined
  await user.save()

  sendTokenResponse(user, 200, res)
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
    sameSite: "None", // Cần thiết cho cross-site requests
    secure: process.env.NODE_ENV === "production", // Sử dụng secure trong production
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
