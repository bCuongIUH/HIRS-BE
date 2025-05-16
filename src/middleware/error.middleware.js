const ErrorResponse = require("../utils/errorResponse")

const errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message

  // Log lỗi cho developer
  console.log(err)

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = `Không tìm thấy tài nguyên với id: ${err.value}`
    error = new ErrorResponse(message, 404)
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = "Dữ liệu đã tồn tại"
    error = new ErrorResponse(message, 400)
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((val) => val.message)
    error = new ErrorResponse(message, 400)
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || "Lỗi server",
  })
}

module.exports = { errorHandler }
