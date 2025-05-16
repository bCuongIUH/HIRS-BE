const User = require("../models/user.model")
const asyncHandler = require("../middleware/async.middleware")
const ErrorResponse = require("../utils/errorResponse")

// @desc    Lấy tất cả người dùng
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults)
})

// @desc    Lấy một người dùng
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    return next(new ErrorResponse(`Không tìm thấy người dùng với ID: ${req.params.id}`, 404))
  }

  res.status(200).json({
    success: true,
    data: user,
  })
})

// @desc    Tạo người dùng
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = asyncHandler(async (req, res, next) => {
  const user = await User.create(req.body)

  res.status(201).json({
    success: true,
    data: user,
  })
})

// @desc    Cập nhật người dùng
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })

  if (!user) {
    return next(new ErrorResponse(`Không tìm thấy người dùng với ID: ${req.params.id}`, 404))
  }

  res.status(200).json({
    success: true,
    data: user,
  })
})

// @desc    Xóa người dùng
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    return next(new ErrorResponse(`Không tìm thấy người dùng với ID: ${req.params.id}`, 404))
  }

  await user.remove()

  res.status(200).json({
    success: true,
    data: {},
  })
})
