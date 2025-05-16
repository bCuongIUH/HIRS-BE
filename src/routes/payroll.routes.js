const express = require("express")
const {
  getPayrolls,
  getPayroll,
  calculatePayroll,
  approvePayroll,
  payPayroll,
  cancelPayroll,
  getPayrollStats,
  getEmployeePayrolls,
} = require("../controllers/payroll.controller")

const Payroll = require("../models/payroll.model")

const router = express.Router()

const advancedResults = require("../middleware/advancedResults.middleware")
const { protect, authorize } = require("../middleware/auth.middleware")

// Áp dụng middleware bảo vệ cho tất cả các routes
router.use(protect)

// Route để lấy thống kê bảng lương
router.get("/stats", authorize("admin"), getPayrollStats)

// Route để lấy bảng lương theo nhân viên
router.get("/employee/:employeeId", getEmployeePayrolls)

// Route để tính lương
router.post("/calculate", authorize("admin"), calculatePayroll)

// Route để phê duyệt, thanh toán, hủy bảng lương
router.put("/:id/approve", authorize("admin"), approvePayroll)
router.put("/:id/pay", authorize("admin"), payPayroll)
router.put("/:id/cancel", authorize("admin"), cancelPayroll)

router.route("/").get(
  advancedResults(Payroll, [
    {
      path: "employee",
      select: "firstName lastName employeeId position department",
      populate: {
        path: "department",
        select: "name",
      },
    },
    { path: "createdBy", select: "name" },
    { path: "approvedBy", select: "name" },
  ]),
  getPayrolls,
)

router.route("/:id").get(getPayroll)

module.exports = router
