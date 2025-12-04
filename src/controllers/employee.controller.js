const Employee = require("../models/employee.model")
const User = require("../models/user.model")
const Transaction = require("../models/transaction.model")
const asyncHandler = require("../middleware/async.middleware")
const ErrorResponse = require("../utils/errorResponse")

// @desc    Lấy tất cả nhân viên
// @route   GET /api/employees
// @access  Private
exports.getEmployees = asyncHandler(async (req, res, next) => {
  const employees = await Employee.find()
    .populate("user", "name email")

  res.status(200).json({
    success: true,
    count: employees.length,
    data: employees,
  })
})


// @desc    Lấy một nhân viên
// @route   GET /api/employees/:id
// @access  Private
exports.getEmployee = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findById(req.params.id).populate("user", "name email")

  if (!employee) {
    return next(new ErrorResponse(`Không tìm thấy nhân viên với ID: ${req.params.id}`, 404))
  }

  res.status(200).json({
    success: true,
    data: employee,
  })
})

// @desc    Tạo nhân viên mới
// @route   POST /api/employees
// @access  Private/Admin
exports.createEmployee = asyncHandler(async (req, res, next) => {
  // Kiểm tra xem đã có user chưa
  let user = null

  if (req.body.email) {
    // Tạo user mới nếu có email
    user = await User.create({
      name: `${req.body.firstName} ${req.body.lastName}`,
      email: req.body.email,
       phone: req.body.phone,
      password: req.body.password || "bookstore", // Mật khẩu mặc định
      role: req.body.role || "employee", 
    })

    req.body.user = user._id
  } else if (req.body.userId) {
    // Nếu đã có user sẵn
    user = await User.findById(req.body.userId)
    if (!user) {
      return next(new ErrorResponse(`Không tìm thấy người dùng với ID: ${req.body.userId}`, 404))
    }
    req.body.user = req.body.userId
  } else {
    return next(new ErrorResponse("Vui lòng cung cấp email hoặc userId", 400))
  }

  // Tạo mã nhân viên tự động nếu chưa có
  if (!req.body.employeeId) {
    const count = await Employee.countDocuments()
    req.body.employeeId = `NV${(count + 1).toString().padStart(3, "0")}`
  }

  // Thêm avatar mặc định nếu không có
  if (!req.body.avatar) {
    req.body.avatar = "/images/default-avatar.png"
  }

  // Trạng thái mặc định
  if (!req.body.employmentStatus) {
    req.body.employmentStatus = "active"
  }

  // ✳️ Chỉ lấy những trường cần thiết
  const employeeData = {
    user: req.body.user,
    employeeId: req.body.employeeId,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
     email: req.body.email,
    gender: req.body.gender,
    dateOfBirth: req.body.dateOfBirth,
    phone: req.body.phone,
    avatar: req.body.avatar,
    employmentStatus: req.body.employmentStatus,
    role: req.body.role || "employee",
  }

  // Tạo nhân viên
  const employee = await Employee.create(employeeData)

  // Ghi log / transaction
  await Transaction.create({
    user: req.user.id,
    action: "create",
    module: "employee",
    description: `Đã thêm nhân viên mới: ${req.body.firstName} ${req.body.lastName}`,
    targetId: employee._id,
    targetModel: "Employee",
    details: {
      employeeId: employee.employeeId,
      name: `${employee.firstName} ${employee.lastName}`,
    },
  })

  res.status(201).json({
    success: true,
    data: employee,
  })
})

// @desc    Cập nhật nhân viên
// @route   PUT /api/employees/:id
// @access  Private/Admin
exports.updateEmployee = asyncHandler(async (req, res, next) => {
  let employee = await Employee.findById(req.params.id)

  if (!employee) {
    return next(new ErrorResponse(`Không tìm thấy nhân viên với ID: ${req.params.id}`, 404))
  }

  // Cập nhật thông tin user nếu cần
  if (req.body.email || req.body.name) {
    const userData = {}
    if (req.body.email) userData.email = req.body.email
    if (req.body.firstName && req.body.lastName) {
      userData.name = `${req.body.firstName} ${req.body.lastName}`
    }

    await User.findByIdAndUpdate(employee.user, userData, {
      runValidators: true,
    })
  }

  employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })

  // Tạo transaction/thông báo
  await Transaction.create({
    user: req.user.id,
    action: "update",
    module: "employee",
    description: `Đã cập nhật thông tin nhân viên: ${employee.firstName} ${employee.lastName}`,
    targetId: employee._id,
    targetModel: "Employee",
    details: {
      employeeId: employee.employeeId,
      name: `${employee.firstName} ${employee.lastName}`,
      position: employee.position,
      // department: employee.department,
    },
  })

  res.status(200).json({
    success: true,
    data: employee,
  })
})

// @desc    Xóa nhân viên
// @route   DELETE /api/employees/:id
// @access  Private/Admin
exports.deleteEmployee = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findById(req.params.id)

  if (!employee) {
    return next(new ErrorResponse(`Không tìm thấy nhân viên với ID: ${req.params.id}`, 404))
  }
  if (req.user.role === "admin" && ["admin", "manager"].includes(employee.role)) {
    return next(
      new ErrorResponse("Bạn không có quyền cho nghỉ việc người có vai trò quản lý hoặc admin", 403)
    )
  }
  if (employee.status === "nghi_viec") {
    return next(new ErrorResponse("Nhân viên này đã nghỉ việc trước đó", 400))
  }
  employee.employmentStatus = "nghi_viec"
  employee.status = "nghi_viec";  
  await employee.save()

 
  const user = await User.findOne({ _id: employee.user });
  if (user) {
    user.isDelete = "true"; 
    await user.save();
  }
  await Transaction.create({
    user: req.user.id,
    action: "update",
    module: "employee",
    description: `Đã chuyển nhân viên ${employee.firstName} ${employee.lastName} sang trạng thái nghỉ việc`,
    details: {
      id: employee._id,
      name: `${employee.firstName} ${employee.lastName}`,
      position: employee.position,
      department: employee.department,
      status: employee.status,
    },
  })

  res.status(200).json({
    success: true,
    message: `Nhân viên ${employee.firstName} ${employee.lastName} đã được chuyển sang trạng thái nghỉ việc`,
    data: employee,
  })
})


// Lấy thông tin nhân viên theo userId
exports.getEmployeeByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const employee = await Employee.findOne({ user: userId });

    if (!employee) {
      return res.status(404).json({ success: false, message: "Không tìm thấy nhân viên cho user này." });
    }

    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin nhân viên:", error);
    res.status(500).json({ success: false, message: "Lỗi server.", error: error.message });
  }
};