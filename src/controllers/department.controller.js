const Department = require("../models/department.model")
const Transaction = require("../models/transaction.model")
const asyncHandler = require("../middleware/async.middleware")
const ErrorResponse = require("../utils/errorResponse")

// @desc    Lấy tất cả phòng ban
// @route   GET /api/departments
// @access  Private
exports.getDepartments = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults)
})

// @desc    Lấy một phòng ban
// @route   GET /api/departments/:id
// @access  Private
exports.getDepartment = asyncHandler(async (req, res, next) => {
  const department = await Department.findById(req.params.id).populate("manager", "firstName lastName")

  if (!department) {
    return next(new ErrorResponse(`Không tìm thấy phòng ban với ID: ${req.params.id}`, 404))
  }

  res.status(200).json({
    success: true,
    data: department,
  })
})

// @desc    Tạo phòng ban mới
// @route   POST /api/departments
// @access  Private/Admin
exports.createDepartment = asyncHandler(async (req, res, next) => {
  const department = await Department.create(req.body)

  // Tạo transaction/thông báo
  await Transaction.create({
    user: req.user.id,
    action: "create",
    module: "department",
    description: `Đã tạo phòng ban mới: ${department.name}`,
    targetId: department._id,
    targetModel: "Department",
    details: {
      name: department.name,
      description: department.description,
    },
  })

  res.status(201).json({
    success: true,
    data: department,
  })
})

// @desc    Cập nhật phòng ban
// @route   PUT /api/departments/:id
// @access  Private/Admin
exports.updateDepartment = asyncHandler(async (req, res, next) => {
  let department = await Department.findById(req.params.id)

  if (!department) {
    return next(new ErrorResponse(`Không tìm thấy phòng ban với ID: ${req.params.id}`, 404))
  }

  department = await Department.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })

  // Tạo transaction/thông báo
  await Transaction.create({
    user: req.user.id,
    action: "update",
    module: "department",
    description: `Đã cập nhật thông tin phòng ban: ${department.name}`,
    targetId: department._id,
    targetModel: "Department",
    details: {
      name: department.name,
      description: department.description,
    },
  })

  res.status(200).json({
    success: true,
    data: department,
  })
})

// @desc    Xóa phòng ban
// @route   DELETE /api/departments/:id
// @access  Private/Admin
exports.deleteDepartment = asyncHandler(async (req, res, next) => {
  const department = await Department.findById(req.params.id)

  if (!department) {
    return next(new ErrorResponse(`Không tìm thấy phòng ban với ID: ${req.params.id}`, 404))
  }

  // Lưu thông tin phòng ban trước khi xóa để tạo transaction
  const departmentInfo = {
    id: department._id,
    name: department.name,
    description: department.description,
  }

  await department.deleteOne()

  // Tạo transaction/thông báo
  await Transaction.create({
    user: req.user.id,
    action: "delete",
    module: "department",
    description: `Đã xóa phòng ban: ${departmentInfo.name}`,
    details: departmentInfo,
  })

  res.status(200).json({
    success: true,
    data: {},
  })
})
