const Employee = require("../models/employee.model")
const User = require("../models/user.model")
const Transaction = require("../models/transaction.model")
const asyncHandler = require("../middleware/async.middleware")
const ErrorResponse = require("../utils/errorResponse")

// @desc    Lấy tất cả nhân viên
// @route   GET /api/employees
// @access  Private
exports.getEmployees = asyncHandler(async (req, res, next) => {
  const employees = await Employee.find({ employmentStatus: "active" })
    .populate("user", "name email")
    .populate("department", "name")

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
  const employee = await Employee.findById(req.params.id).populate("user", "name email").populate("department", "name")

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
    // Tạo user mới nếu cung cấp email
    user = await User.create({
      name: `${req.body.firstName} ${req.body.lastName}`,
      email: req.body.email,
      // password: req.body.password || Math.random().toString(36).slice(-8), // Tạo mật khẩu ngẫu nhiên nếu không cung cấp
      password: req.body.password || "bookstore", // Mật khẩu mặc định
      role: req.body.role || "employee",
    })

    // Thêm user ID vào dữ liệu nhân viên
    req.body.user = user._id
  } else if (req.body.userId) {
    // Sử dụng user ID hiện có nếu được cung cấp
    user = await User.findById(req.body.userId)
    if (!user) {
      return next(new ErrorResponse(`Không tìm thấy người dùng với ID: ${req.body.userId}`, 404))
    }
    req.body.user = req.body.userId
  } else {
    return next(new ErrorResponse("Vui lòng cung cấp email hoặc userId", 400))
  }

  // Tạo mã nhân viên nếu không được cung cấp
  if (!req.body.employeeId) {
    const count = await Employee.countDocuments()
    req.body.employeeId = `NV${(count + 1).toString().padStart(3, "0")}`
  }

  // Thêm avatar mặc định nếu không được cung cấp
  if (!req.body.avatar) {
    req.body.avatar = "/images/default-avatar.png"
  }

  // Thêm trạng thái mặc định nếu không được cung cấp
  if (!req.body.employmentStatus) {
    req.body.employmentStatus = "active"
  }

  const employee = await Employee.create(req.body)

  // Tạo transaction/thông báo
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
      // position: employee.position,
      department: employee.department,
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
      department: employee.department,
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

  // Lưu thông tin nhân viên trước khi xóa để tạo transaction
  const employeeInfo = {
    id: employee._id,
    employeeId: employee.employeeId,
    name: `${employee.firstName} ${employee.lastName}`,
    position: employee.position,
    department: employee.department,
  }

  // Xóa user liên kết nếu cần
  if (req.body.deleteUser) {
    await User.findByIdAndDelete(employee.user)
  }

  await employee.deleteOne()

  // Tạo transaction/thông báo
  await Transaction.create({
    user: req.user.id,
    action: "delete",
    module: "employee",
    description: `Đã xóa nhân viên: ${employeeInfo.name}`,
    details: employeeInfo,
  })

  res.status(200).json({
    success: true,
    data: {},
  })
})

// @desc    Lấy nhân viên theo phòng ban
// @route   GET /api/employees/department/:departmentId
// @access  Private
exports.getEmployeesByDepartment = asyncHandler(async (req, res, next) => {
  const employees = await Employee.find({ department: req.params.departmentId })
    .populate("user", "name email")
    .populate("department", "name")

  res.status(200).json({
    success: true,
    count: employees.length,
    data: employees,
  })
})
