const User = require("../models/user.model");
const Customer = require("../models/customer.model");
const Otp = require("../models/otp.model");
const asyncHandler = require("../middleware/async.middleware");
const ErrorResponse = require("../utils/errorResponse");
const sendEmail = require("../utils/sendEmail");

// 🔹 Bước 1: Nhập thông tin → gửi OTP
exports.sendOtpForRegistration = asyncHandler(async (req, res, next) => {
  const { fullName, email, phone, password, confirmPassword } = req.body;

  if (!fullName || !email || !phone || !password || !confirmPassword)
    return next(new ErrorResponse("Vui lòng nhập đầy đủ thông tin", 400));

  if (password !== confirmPassword)
    return next(new ErrorResponse("Mật khẩu xác nhận không khớp", 400));

  const existingUser = await User.findOne({ email });
  if (existingUser) return next(new ErrorResponse("Email đã được sử dụng", 400));

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Lưu OTP + dữ liệu đăng ký tạm thời
  await Otp.create({
    email,
    code,
    expiresAt: Date.now() + 5 * 60 * 1000,
    verified: false,
    meta: { fullName, phone, password },
  });

  await sendEmail(email, "Mã OTP xác thực đăng ký", `Mã OTP của bạn là: ${code}. Hết hạn sau 5 phút.`);

  res.status(200).json({ success: true, message: "OTP đã được gửi tới email của bạn" });
});

// 🔹 Bước 2: Nhập OTP → hoàn tất đăng ký
exports.verifyOtpAndRegister = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp)
    return next(new ErrorResponse("Vui lòng nhập email và OTP", 400));

  const otpRecord = await Otp.findOne({ email, code: otp, verified: false });

  if (!otpRecord)
    return next(new ErrorResponse("OTP không hợp lệ", 400));

  if (otpRecord.expiresAt < Date.now())
    return next(new ErrorResponse("OTP đã hết hạn", 400));

  // 🔹 Check meta tồn tại
  if (!otpRecord.meta)
    return next(new ErrorResponse(
      "Thông tin đăng ký chưa được lưu. Vui lòng gửi lại OTP với đầy đủ thông tin",
      400
    ));

  const { fullName, phone, password } = otpRecord.meta;

  const user = await User.create({ name: fullName, email, password, role: "customer" });
  const customer = await Customer.create({ user: user._id, fullName, email, phone });

  otpRecord.verified = true;
  await otpRecord.save();

  sendTokenResponse(user, 201, res, customer);
});


// 🔹 Login khách hàng
exports.loginCustomer = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password)
    return next(new ErrorResponse("Vui lòng nhập email và mật khẩu", 400));

  const user = await User.findOne({ email, role: "customer" }).select("+password");
  if (!user) return next(new ErrorResponse("Tài khoản không tồn tại", 404));

  const isMatch = await user.matchPassword(password);
  if (!isMatch) return next(new ErrorResponse("Mật khẩu không đúng", 401));

  const customer = await Customer.findOne({ user: user._id });
  user.lastLogin = Date.now();
  await user.save();

  sendTokenResponse(user, 200, res, customer);
});

// 🔹 Hàm trả token
const sendTokenResponse = (user, statusCode, res, customer) => {
  const token = user.getSignedJwtToken();
  res.status(statusCode).json({
    success: true,
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    customer,
  });
};
