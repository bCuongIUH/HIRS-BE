const express = require("express")
const {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require("../controllers/department.controller")

const Department = require("../models/department.model")

const router = express.Router()

const advancedResults = require("../middleware/advancedResults.middleware")
const { protect, authorize } = require("../middleware/auth.middleware")

// Áp dụng middleware bảo vệ cho tất cả các routes
router.use(protect)

router
  .route("/")
  .get(
    advancedResults(Department, {
      path: "manager",
      select: "firstName lastName",
    }),
    getDepartments,
  )
  .post(authorize("admin"), createDepartment)

router
  .route("/:id")
  .get(getDepartment)
  .put(authorize("admin"), updateDepartment)
  .delete(authorize("admin"), deleteDepartment)

module.exports = router
