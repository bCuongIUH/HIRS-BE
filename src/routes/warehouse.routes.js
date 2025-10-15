const express = require("express");
const router = express.Router();
const warehouseController = require("../controllers/warehouse.controller");

// 📦 Tạo phiếu nhập kho
router.post("/", warehouseController.createWarehouseEntry);

// 🧾 Lấy danh sách phiếu nhập
router.get("/", warehouseController.getAllWarehouses);

// 🔍 Lấy chi tiết phiếu nhập
router.get("/:id", warehouseController.getWarehouseById);

module.exports = router;
