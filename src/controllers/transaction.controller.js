const Transaction = require("../models/transaction.model")
const asyncHandler = require("../middleware/async.middleware")
const ErrorResponse = require("../utils/errorResponse")

// @desc    Lấy tất cả giao dịch/thông báo
// @route   GET /api/transactions
// @access  Private
exports.getTransactions = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults)
})

// @desc    Lấy các thông báo gần đây
// @route   GET /api/transactions/recent
// @access  Private
exports.getRecentTransactions = asyncHandler(async (req, res, next) => {
  const transactions = await Transaction.find().sort({ createdAt: -1 }).limit(10).populate({
    path: "user",
    select: "name",
  })

  res.status(200).json({
    success: true,
    count: transactions.length,
    data: transactions,
  })
})

// @desc    Tạo giao dịch/thông báo mới
// @route   POST /api/transactions
// @access  Private
exports.createTransaction = asyncHandler(async (req, res, next) => {
  // Thêm user ID từ request
  req.body.user = req.user.id

  const transaction = await Transaction.create(req.body)

  res.status(201).json({
    success: true,
    data: transaction,
  })
})

// @desc    Đánh dấu thông báo đã đọc
// @route   PUT /api/transactions/:id/read
// @access  Private
exports.markAsRead = asyncHandler(async (req, res, next) => {
  let transaction = await Transaction.findById(req.params.id)

  if (!transaction) {
    return next(new ErrorResponse(`Không tìm thấy thông báo với ID: ${req.params.id}`, 404))
  }

  transaction = await Transaction.findByIdAndUpdate(
    req.params.id,
    { isRead: true },
    {
      new: true,
      runValidators: true,
    },
  )

  res.status(200).json({
    success: true,
    data: transaction,
  })
})

// @desc    Đánh dấu tất cả thông báo đã đọc
// @route   PUT /api/transactions/read-all
// @access  Private
exports.markAllAsRead = asyncHandler(async (req, res, next) => {
  await Transaction.updateMany({ isRead: false }, { isRead: true })

  res.status(200).json({
    success: true,
    message: "Tất cả thông báo đã được đánh dấu là đã đọc",
  })
})
