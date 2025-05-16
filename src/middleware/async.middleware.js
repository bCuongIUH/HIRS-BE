// Middleware xử lý async/await để tránh try-catch lặp lại
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

module.exports = asyncHandler
