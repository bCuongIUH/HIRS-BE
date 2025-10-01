const express = require("express")
const {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require("../controllers/employee.controller")

const Employee = require("../models/employee.model")

const router = express.Router()

const advancedResults = require("../middleware/advancedResults.middleware")
const { protect, authorize } = require("../middleware/auth.middleware")

// Áp dụng middleware bảo vệ cho tất cả các routes
router.use(protect)


router
  .route("/")
  .get(
    advancedResults(Employee, [
      { path: "user", select: "name email" },
    ]),
    getEmployees,
  )
  .post(authorize("admin", "hr"), createEmployee)

router
  .route("/:id")
  .get(getEmployee)
  .put(authorize("admin", "hr"), updateEmployee)
  .delete(authorize("admin"), deleteEmployee)

module.exports = router
