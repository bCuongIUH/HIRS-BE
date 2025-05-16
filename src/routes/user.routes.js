const express = require("express")
const { getUsers, getUser, createUser, updateUser, deleteUser } = require("../controllers/user.controller")

const User = require("../models/user.model")

const router = express.Router()

const advancedResults = require("../middleware/advancedResults.middleware")
const { protect, authorize } = require("../middleware/auth.middleware")

// Áp dụng middleware bảo vệ cho tất cả các routes
router.use(protect)
// Chỉ admin mới có quyền truy cập
router.use(authorize("admin"))

router.route("/").get(advancedResults(User), getUsers).post(createUser)

router.route("/:id").get(getUser).put(updateUser).delete(deleteUser)

module.exports = router
