const jwt = require("jsonwebtoken")
const asyncHandler = require("./async.middleware")
const ErrorResponse = require("../utils/errorResponse")
const User = require("../models/user.model")

// Bảo vệ routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token

  // Kiểm tra header Authorization
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    // Lấy token từ header
    token = req.headers.authorization.split(" ")[1]
  }
  // Kiểm tra token trong cookie
  else if (req.cookies.token) {
    token = req.cookies.token
  }

  // Đảm bảo token tồn tại
  if (!token) {
    return next(new ErrorResponse("Không có quyền truy cập vào route này", 401))
  }

  try {
    // Xác minh token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Lấy thông tin người dùng từ token
    req.user = await User.findById(decoded.id)

    next()
  } catch (err) {
    return next(new ErrorResponse("Không có quyền truy cập vào route này", 401))
  }
})

// Cấp quyền cho các vai trò
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ErrorResponse(`Vai trò ${req.user.role} không có quyền truy cập vào route này`, 403))
    }
    next()
  }
}
