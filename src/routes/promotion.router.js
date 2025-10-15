const express = require("express");
const router = express.Router();
const promotionController = require("../controllers/promotion.controller");

// Thêm 1 khuyến mãi
router.post("/", promotionController.createPromotion);

// Lấy danh sách khuyến mãi (isDeleted = false)
router.get("/", promotionController.getAllPromotions);

// Xóa mềm khuyến mãi
router.delete("/:id", promotionController.deletePromotion);

module.exports = router;
