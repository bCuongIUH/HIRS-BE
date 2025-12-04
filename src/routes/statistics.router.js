const express = require("express");
const router = express.Router();
const { getStatistics, getTopProducts } = require("../controllers/statistics.controller");

router.get("/", getStatistics);
router.get("/top", getTopProducts);
module.exports = router;
