const Payroll = require("../models/payroll.model")
const Employee = require("../models/employee.model")
const Transaction = require("../models/transaction.model")
const asyncHandler = require("../middleware/async.middleware")
const ErrorResponse = require("../utils/errorResponse")

// @desc    Lấy tất cả bảng lương
// @route   GET /api/payrolls
// @access  Private
exports.getPayrolls = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults)
})

// @desc    Lấy một bảng lương
// @route   GET /api/payrolls/:id
// @access  Private
exports.getPayroll = asyncHandler(async (req, res, next) => {
  const payroll = await Payroll.findById(req.params.id)
    .populate({
      path: "employee",
      select: "firstName lastName employeeId position department",
      populate: {
        path: "department",
        select: "name",
      },
    })
    .populate("createdBy", "name")
    .populate("approvedBy", "name")

  if (!payroll) {
    return next(new ErrorResponse(`Không tìm thấy bảng lương với ID: ${req.params.id}`, 404))
  }

  res.status(200).json({
    success: true,
    data: payroll,
  })
})

// @desc    Tính lương cho nhân viên
// @route   POST /api/payrolls/calculate
// @access  Private/Admin
exports.calculatePayroll = asyncHandler(async (req, res, next) => {
  const { employeeId, month, year, workingDays, actualWorkDays, overtime, allowances, deductions } = req.body

  // Kiểm tra dữ liệu đầu vào
  if (!employeeId || !month || !year || !actualWorkDays) {
    return next(new ErrorResponse("Vui lòng cung cấp đầy đủ thông tin", 400))
  }

  // Tìm nhân viên
  const employee = await Employee.findById(employeeId).populate("department", "name")

  if (!employee) {
    return next(new ErrorResponse(`Không tìm thấy nhân viên với ID: ${employeeId}`, 404))
  }

  // Lấy lương cơ bản
  const baseSalary = employee.salary?.baseSalary || 0

  // Tính lương theo ngày công
  const dailyRate = baseSalary / workingDays
  const regularSalary = dailyRate * actualWorkDays

  // Tính lương làm thêm giờ (1.5x lương giờ thông thường)
  const hourlyRate = dailyRate / 8 // Giả sử 8 giờ làm việc mỗi ngày
  const overtimePay = hourlyRate * 1.5 * overtime

  // Tính tổng phụ cấp
  const totalAllowances = allowances.reduce((sum, item) => sum + Number(item.amount), 0)

  // Tính tổng khấu trừ
  const totalDeductions = deductions.reduce((sum, item) => sum + Number(item.amount), 0)

  // Tính lương tổng và thực lãnh
  const grossSalary = regularSalary + overtimePay + totalAllowances
  const netSalary = grossSalary - totalDeductions

  // Tạo đối tượng bảng lương
  const payrollData = {
    employee: employeeId,
    period: {
      month: Number.parseInt(month),
      year: Number.parseInt(year),
    },
    workingDays: {
      standard: Number.parseInt(workingDays),
      actual: Number.parseInt(actualWorkDays),
      overtime: Number.parseFloat(overtime),
    },
    salary: {
      baseSalary,
      dailyRate,
      regularSalary,
      overtimePay,
    },
    allowances,
    deductions,
    totalAllowances,
    totalDeductions,
    grossSalary,
    netSalary,
    status: "draft",
    createdBy: req.user.id,
  }

  // Kiểm tra xem đã có bảng lương cho nhân viên này trong kỳ lương này chưa
  let payroll = await Payroll.findOne({
    employee: employeeId,
    "period.month": Number.parseInt(month),
    "period.year": Number.parseInt(year),
  })

  if (payroll) {
    // Cập nhật bảng lương hiện có
    payroll = await Payroll.findByIdAndUpdate(payroll._id, payrollData, {
      new: true,
      runValidators: true,
    })

    // Tạo transaction/thông báo
    await Transaction.create({
      user: req.user.id,
      action: "update",
      module: "payroll",
      description: `Đã cập nhật bảng lương tháng ${month}/${year} cho nhân viên ${employee.firstName} ${employee.lastName}`,
      targetId: payroll._id,
      targetModel: "Payroll",
      details: {
        employeeId: employee.employeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        period: `${month}/${year}`,
        grossSalary,
        netSalary,
      },
    })
  } else {
    // Tạo bảng lương mới
    payroll = await Payroll.create(payrollData)

    // Tạo transaction/thông báo
    await Transaction.create({
      user: req.user.id,
      action: "create",
      module: "payroll",
      description: `Đã tính lương tháng ${month}/${year} cho nhân viên ${employee.firstName} ${employee.lastName}`,
      targetId: payroll._id,
      targetModel: "Payroll",
      details: {
        employeeId: employee.employeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        period: `${month}/${year}`,
        grossSalary,
        netSalary,
      },
    })
  }

  res.status(200).json({
    success: true,
    data: payroll,
  })
})

// @desc    Phê duyệt bảng lương
// @route   PUT /api/payrolls/:id/approve
// @access  Private/Admin
exports.approvePayroll = asyncHandler(async (req, res, next) => {
  const payroll = await Payroll.findById(req.params.id).populate({
    path: "employee",
    select: "firstName lastName employeeId",
  })

  if (!payroll) {
    return next(new ErrorResponse(`Không tìm thấy bảng lương với ID: ${req.params.id}`, 404))
  }

  // Cập nhật trạng thái bảng lương
  payroll.status = "approved"
  payroll.approvedBy = req.user.id
  payroll.approvedAt = Date.now()

  await payroll.save()

  // Tạo transaction/thông báo
  await Transaction.create({
    user: req.user.id,
    action: "update",
    module: "payroll",
    description: `Đã phê duyệt bảng lương tháng ${payroll.period.month}/${payroll.period.year} cho nhân viên ${payroll.employee.firstName} ${payroll.employee.lastName}`,
    targetId: payroll._id,
    targetModel: "Payroll",
    details: {
      employeeId: payroll.employee.employeeId,
      employeeName: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
      period: `${payroll.period.month}/${payroll.period.year}`,
      grossSalary: payroll.grossSalary,
      netSalary: payroll.netSalary,
    },
  })

  res.status(200).json({
    success: true,
    data: payroll,
  })
})

// @desc    Đánh dấu bảng lương đã thanh toán
// @route   PUT /api/payrolls/:id/pay
// @access  Private/Admin
exports.payPayroll = asyncHandler(async (req, res, next) => {
  const { paymentMethod, paymentReference, paymentDate } = req.body

  const payroll = await Payroll.findById(req.params.id).populate({
    path: "employee",
    select: "firstName lastName employeeId",
  })

  if (!payroll) {
    return next(new ErrorResponse(`Không tìm thấy bảng lương với ID: ${req.params.id}`, 404))
  }

  // Kiểm tra xem bảng lương đã được phê duyệt chưa
  if (payroll.status !== "approved") {
    return next(new ErrorResponse("Bảng lương chưa được phê duyệt", 400))
  }

  // Cập nhật trạng thái bảng lương
  payroll.status = "paid"
  payroll.paymentMethod = paymentMethod
  payroll.paymentReference = paymentReference
  payroll.paymentDate = paymentDate || Date.now()

  await payroll.save()

  // Tạo transaction/thông báo
  await Transaction.create({
    user: req.user.id,
    action: "update",
    module: "payroll",
    description: `Đã thanh toán lương tháng ${payroll.period.month}/${payroll.period.year} cho nhân viên ${payroll.employee.firstName} ${payroll.employee.lastName}`,
    targetId: payroll._id,
    targetModel: "Payroll",
    details: {
      employeeId: payroll.employee.employeeId,
      employeeName: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
      period: `${payroll.period.month}/${payroll.period.year}`,
      grossSalary: payroll.grossSalary,
      netSalary: payroll.netSalary,
      paymentMethod,
      paymentReference,
      paymentDate: payroll.paymentDate,
    },
  })

  res.status(200).json({
    success: true,
    data: payroll,
  })
})

// @desc    Hủy bảng lương
// @route   PUT /api/payrolls/:id/cancel
// @access  Private/Admin
exports.cancelPayroll = asyncHandler(async (req, res, next) => {
  const payroll = await Payroll.findById(req.params.id).populate({
    path: "employee",
    select: "firstName lastName employeeId",
  })

  if (!payroll) {
    return next(new ErrorResponse(`Không tìm thấy bảng lương với ID: ${req.params.id}`, 404))
  }

  // Kiểm tra xem bảng lương đã được thanh toán chưa
  if (payroll.status === "paid") {
    return next(new ErrorResponse("Không thể hủy bảng lương đã thanh toán", 400))
  }

  // Cập nhật trạng thái bảng lương
  payroll.status = "cancelled"

  await payroll.save()

  // Tạo transaction/thông báo
  await Transaction.create({
    user: req.user.id,
    action: "update",
    module: "payroll",
    description: `Đã hủy bảng lương tháng ${payroll.period.month}/${payroll.period.year} cho nhân viên ${payroll.employee.firstName} ${payroll.employee.lastName}`,
    targetId: payroll._id,
    targetModel: "Payroll",
    details: {
      employeeId: payroll.employee.employeeId,
      employeeName: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
      period: `${payroll.period.month}/${payroll.period.year}`,
    },
  })

  res.status(200).json({
    success: true,
    data: payroll,
  })
})

// @desc    Lấy thống kê bảng lương
// @route   GET /api/payrolls/stats
// @access  Private/Admin
exports.getPayrollStats = asyncHandler(async (req, res, next) => {
  // Tổng số bảng lương
  const totalPayrolls = await Payroll.countDocuments()

  // Tổng số tiền lương đã chi
  const paidPayrolls = await Payroll.find({ status: "paid" })
  const totalPaid = paidPayrolls.reduce((sum, payroll) => sum + payroll.netSalary, 0)

  // Tổng số tiền lương chờ thanh toán
  const pendingPayrolls = await Payroll.find({ status: "approved" })
  const totalPending = pendingPayrolls.reduce((sum, payroll) => sum + payroll.netSalary, 0)

  // Thống kê theo tháng (6 tháng gần nhất)
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  const monthlyStats = []
  for (let i = 0; i < 6; i++) {
    let month = currentMonth - i
    let year = currentYear
    if (month <= 0) {
      month += 12
      year -= 1
    }

    const payrolls = await Payroll.find({
      "period.month": month,
      "period.year": year,
      status: { $in: ["approved", "paid"] },
    })

    const totalAmount = payrolls.reduce((sum, payroll) => sum + payroll.netSalary, 0)

    monthlyStats.push({
      month,
      year,
      totalAmount,
      count: payrolls.length,
    })
  }

  res.status(200).json({
    success: true,
    data: {
      totalPayrolls,
      totalPaid,
      totalPending,
      monthlyStats,
    },
  })
})

// @desc    Lấy bảng lương theo nhân viên
// @route   GET /api/payrolls/employee/:employeeId
// @access  Private
exports.getEmployeePayrolls = asyncHandler(async (req, res, next) => {
  const payrolls = await Payroll.find({ employee: req.params.employeeId })
    .sort({ "period.year": -1, "period.month": -1 })
    .populate({
      path: "employee",
      select: "firstName lastName employeeId position department",
      populate: {
        path: "department",
        select: "name",
      },
    })
    .populate("createdBy", "name")
    .populate("approvedBy", "name")

  res.status(200).json({
    success: true,
    count: payrolls.length,
    data: payrolls,
  })
})
