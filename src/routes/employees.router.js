const express = require("express");
const router = express.Router();
const { getEmployeeByUserId } = require("../controllers/employee.controller");

// GET /api/employees/user/:userId
router.get("/user/:userId", getEmployeeByUserId);

module.exports = router;
