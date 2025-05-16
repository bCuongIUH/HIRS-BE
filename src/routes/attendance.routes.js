const express = require("express")
const {
  getAttendances,
  getAttendance,
  getMyAttendance,
  clockIn,
  clockOut,
  getAttendanceReport,
} = require("../controllers/attendance.controller")

const Attendance = require("../models/attendance.model")

const router = express.Router()

const advancedResults = require("../middleware/advancedResults.middleware")
const { protect, authorize } = require("../middleware/auth.middleware")

// Áp dụng middleware bảo vệ cho tất cả các routes
router.use(protect)

// Routes cho nhân viên
router.get("/me", getMyAttendance)
router.post("/clock-in", clockIn)
router.post("/clock-out", clockOut)

// Routes cho admin
router.get("/report", authorize("admin", "hr"), getAttendanceReport)

router.route("/").get(
  authorize("admin", "hr"),
  advancedResults(Attendance, [
    {
      path: "employee",
      select: "firstName lastName employeeId position department",
      populate: {
        path: "department",
        select: "name",
      },
    },
  ]),
  getAttendances,
)

router.route("/:id").get(getAttendance)

module.exports = router
