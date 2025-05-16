const Attendance = require("../models/attendance.model")
const Employee = require("../models/employee.model")
const Transaction = require("../models/transaction.model")
const asyncHandler = require("../middleware/async.middleware")
const ErrorResponse = require("../utils/errorResponse")

// @desc    Lấy tất cả bản ghi chấm công
// @route   GET /api/attendance
// @access  Private/Admin
exports.getAttendances = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults)
})

// @desc    Lấy bản ghi chấm công theo ID
// @route   GET /api/attendance/:id
// @access  Private
exports.getAttendance = asyncHandler(async (req, res, next) => {
  const attendance = await Attendance.findById(req.params.id).populate({
    path: "employee",
    select: "firstName lastName employeeId position department",
    populate: {
      path: "department",
      select: "name",
    },
  })

  if (!attendance) {
    return next(new ErrorResponse(`Không tìm thấy bản ghi chấm công với ID: ${req.params.id}`, 404))
  }

  res.status(200).json({
    success: true,
    data: attendance,
  })
})

// @desc    Lấy bản ghi chấm công của nhân viên hiện tại
// @route   GET /api/attendance/me
// @access  Private/Employee
exports.getMyAttendance = asyncHandler(async (req, res, next) => {
  // Tìm employee record dựa trên user ID
  const employee = await Employee.findOne({ user: req.user.id })

  if (!employee) {
    return next(new ErrorResponse("Không tìm thấy thông tin nhân viên", 404))
  }

  // Lấy bản ghi chấm công của ngày hôm nay
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const attendance = await Attendance.findOne({
    employee: employee._id,
    date: {
      $gte: today,
      $lt: tomorrow,
    },
  })

  // Lấy lịch sử chấm công gần đây (7 ngày)
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const recentAttendances = await Attendance.find({
    employee: employee._id,
    date: {
      $gte: sevenDaysAgo,
      $lt: tomorrow,
    },
  }).sort({ date: -1 })

  res.status(200).json({
    success: true,
    data: {
      today: attendance || null,
      recent: recentAttendances,
    },
  })
})

// @desc    Chấm công vào
// @route   POST /api/attendance/clock-in
// @access  Private/Employee
exports.clockIn = asyncHandler(async (req, res, next) => {
  // Tìm employee record dựa trên user ID
  const employee = await Employee.findOne({ user: req.user.id })

  if (!employee) {
    return next(new ErrorResponse("Không tìm thấy thông tin nhân viên", 404))
  }

  // Kiểm tra xem đã chấm công vào hôm nay chưa
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  let attendance = await Attendance.findOne({
    employee: employee._id,
    date: {
      $gte: today,
      $lt: tomorrow,
    },
  })

  if (attendance && attendance.timeIn) {
    return next(new ErrorResponse("Bạn đã chấm công vào hôm nay", 400))
  }

  const now = new Date()
  const location = req.body.location || null

  // Xác định trạng thái (đúng giờ hay đi muộn)
  // Giả sử giờ làm việc bắt đầu lúc 8:00 sáng
  const workStartHour = 8
  const workStartMinute = 0
  const status =
    now.getHours() > workStartHour || (now.getHours() === workStartHour && now.getMinutes() > workStartMinute)
      ? "late"
      : "present"

  if (attendance) {
    // Cập nhật bản ghi hiện có
    attendance.timeIn = now
    attendance.status = status
    attendance.location = location
    await attendance.save()
  } else {
    // Tạo bản ghi mới
    attendance = await Attendance.create({
      employee: employee._id,
      date: today,
      timeIn: now,
      status,
      location,
    })
  }

  // Tạo transaction/thông báo
  await Transaction.create({
    user: req.user.id,
    action: "create",
    module: "attendance",
    description: `${employee.firstName} ${employee.lastName} đã chấm công vào lúc ${now.toLocaleTimeString()}`,
    targetId: attendance._id,
    targetModel: "Attendance",
    details: {
      employeeId: employee.employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      timeIn: now,
      status,
    },
  })

  res.status(200).json({
    success: true,
    data: attendance,
    message: `Chấm công vào thành công lúc ${now.toLocaleTimeString()}`,
  })
})

// @desc    Chấm công ra
// @route   POST /api/attendance/clock-out
// @access  Private/Employee
exports.clockOut = asyncHandler(async (req, res, next) => {
  // Tìm employee record dựa trên user ID
  const employee = await Employee.findOne({ user: req.user.id })

  if (!employee) {
    return next(new ErrorResponse("Không tìm thấy thông tin nhân viên", 404))
  }

  // Kiểm tra xem đã chấm công vào hôm nay chưa
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const attendance = await Attendance.findOne({
    employee: employee._id,
    date: {
      $gte: today,
      $lt: tomorrow,
    },
  })

  if (!attendance || !attendance.timeIn) {
    return next(new ErrorResponse("Bạn chưa chấm công vào hôm nay", 400))
  }

  if (attendance.timeOut) {
    return next(new ErrorResponse("Bạn đã chấm công ra hôm nay", 400))
  }

  const now = new Date()
  const location = req.body.location || null

  // Xác định trạng thái (về sớm hay đúng giờ)
  // Giả sử giờ làm việc kết thúc lúc 17:00 chiều
  const workEndHour = 17
  const workEndMinute = 0
  let status = attendance.status

  if (now.getHours() < workEndHour || (now.getHours() === workEndHour && now.getMinutes() < workEndMinute)) {
    status = "early_leave"
  }

  // Tính tổng số giờ làm việc
  const timeIn = new Date(attendance.timeIn)
  const totalHours = (now - timeIn) / (1000 * 60 * 60) // Chuyển đổi từ milliseconds sang giờ

  // Cập nhật bản ghi
  attendance.timeOut = now
  attendance.totalHours = Number.parseFloat(totalHours.toFixed(2))
  attendance.status = status
  attendance.location = location || attendance.location
  await attendance.save()

  // Tạo transaction/thông báo
  await Transaction.create({
    user: req.user.id,
    action: "update",
    module: "attendance",
    description: `${employee.firstName} ${employee.lastName} đã chấm công ra lúc ${now.toLocaleTimeString()}`,
    targetId: attendance._id,
    targetModel: "Attendance",
    details: {
      employeeId: employee.employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      timeOut: now,
      totalHours: attendance.totalHours,
      status,
    },
  })

  res.status(200).json({
    success: true,
    data: attendance,
    message: `Chấm công ra thành công lúc ${now.toLocaleTimeString()}`,
  })
})

// @desc    Lấy báo cáo chấm công theo khoảng thời gian
// @route   GET /api/attendance/report
// @access  Private/Admin
exports.getAttendanceReport = asyncHandler(async (req, res, next) => {
  const { startDate, endDate, department, employee } = req.query

  // Xây dựng query
  const query = {}

  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    }
  }

  if (employee) {
    query.employee = employee
  }

  if (department) {
    // Tìm tất cả nhân viên thuộc phòng ban
    const employees = await Employee.find({ department })
    query.employee = { $in: employees.map((emp) => emp._id) }
  }

  const attendances = await Attendance.find(query)
    .populate({
      path: "employee",
      select: "firstName lastName employeeId position department",
      populate: {
        path: "department",
        select: "name",
      },
    })
    .sort({ date: -1 })

  res.status(200).json({
    success: true,
    count: attendances.length,
    data: attendances,
  })
})
