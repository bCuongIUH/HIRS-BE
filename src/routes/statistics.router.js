const express = require("express");
const router = express.Router();
const { getStatistics } = require("../controllers/statistics.controller");

router.get("/", getStatistics);

module.exports = router;
