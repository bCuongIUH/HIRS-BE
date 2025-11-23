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

  const user = await User.create({ name: fullName, email, password, role: "customer" , phone});
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
    user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone },
    customer,
  });
};

// ======================
// THÊM ĐỊA CHỈ MỚI
// ======================
// exports.addAddress = async (req, res) => {
//   try {
    
//     const { customerId, street, ward, district, city } = req.body
//     const customer = await Customer.findById(customerId)
  
//     if (!customer)
//       return res.status(404).json({ success: false, message: "Không tìm thấy khách hàng" })
//  console.log('Dữ liệu nhận từ client:', req.body);
//     customer.address.push({ street, ward, district, city })
//     await customer.save()

//     res.status(200).json({ success: true, message: "Đã thêm địa chỉ", addresses: customer.address })
//   } catch (error) {
//     console.error(error)
//     res.status(500).json({ success: false, message: "Lỗi server", error: error.message })
//   }
// }

exports.addAddress = async (req, res) => {
  try {
    const { customerId, street, ward, district, city } = req.body;

    // Kiểm tra nếu có trường nào thiếu
    if (!street || !ward || !district || !city) {
      return res.status(400).json({ success: false, message: "Vui lòng điền đầy đủ thông tin địa chỉ" });
    }

    const customer = await Customer.findById(customerId);

    if (!customer)
      return res.status(404).json({ success: false, message: "Không tìm thấy khách hàng" });

    // Thêm địa chỉ mới vào mảng địa chỉ của khách hàng
    customer.address.push({ street, ward, district, city });
    await customer.save();

    res.status(200).json({ success: true, message: "Đã thêm địa chỉ", addresses: customer.address });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};

// ======================
// LẤY DANH SÁCH ĐỊA CHỈ KHÔNG ẨN
// ======================
exports.getActiveAddresses = async (req, res) => {
  try {
    const { customerId } = req.params
    const customer = await Customer.findById(customerId)
    if (!customer)
      return res.status(404).json({ success: false, message: "Không tìm thấy khách hàng" })

    const activeAddresses = customer.address.filter(addr => !addr.isDeleted)
    res.status(200).json({ success: true, addresses: activeAddresses })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "Lỗi server", error: error.message })
  }
}


// ======================
// CẬP NHẬT ĐỊA CHỈ
// ======================
exports.updateAddress = async (req, res) => {
  try {
    const { customerId, index, street, ward, district, city } = req.body
    const customer = await Customer.findById(customerId)
    if (!customer)
      return res.status(404).json({ success: false, message: "Không tìm thấy khách hàng" })

    if (index < 0 || index >= customer.address.length)
      return res.status(400).json({ success: false, message: "Index không hợp lệ" })

    customer.address[index] = { ...customer.address[index]._doc, street, ward, district, city }
    await customer.save()

    res.status(200).json({ success: true, message: "Đã cập nhật địa chỉ", addresses: customer.address })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "Lỗi server", error: error.message })
  }
}


// ======================
// XÓA ĐỊA CHỈ (SOFT DELETE)
// ======================
exports.softDeleteAddress = async (req, res) => {
  try {
    const { customerId, index } = req.body
    const customer = await Customer.findById(customerId)
    if (!customer)
      return res.status(404).json({ success: false, message: "Không tìm thấy khách hàng" })

    if (index < 0 || index >= customer.address.length)
      return res.status(400).json({ success: false, message: "Index không hợp lệ" })

    customer.address[index].isDeleted = true
    await customer.save()

    res.status(200).json({ success: true, message: "Đã ẩn địa chỉ", addresses: customer.address })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "Lỗi server", error: error.message })
  }
}

// 🔹 Lấy customer theo userId
exports.getCustomerByUserId = async (req, res) => {
  try {
    const { userId } = req.params
    const customer = await Customer.findOne({ user: userId, isActive: true })
    if (!customer) {
      return res.status(404).json({ success: false, message: "Không tìm thấy khách hàng" })
    }
    res.status(200).json({ success: true, data: customer })
  } catch (error) {
    console.error("Lỗi khi lấy customer:", error)
    res.status(500).json({ success: false, message: "Lỗi server" })
  }
}
// 🔹 Lấy danh sách tất cả khách hàng
exports.getAllCustomers = asyncHandler(async (req, res, next) => {
  try {
    
    const customers = await Customer.find({ isActive: true })

    if (!customers || customers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không có khách hàng nào trong hệ thống",
      });
    }

    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
});