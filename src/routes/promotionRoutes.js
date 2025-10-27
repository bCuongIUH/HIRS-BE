const express = require("express")
const router = express.Router()

const {
  createPromotion,
  getPromotions,
  getPromotionById,
  updatePromotion,
  deletePromotion,
  updatePromotionStatus
} = require("../controllers/promotionController")


// ✅ Tạo khuyến mãi
router.post("/", createPromotion)

// ✅ Lấy tất cả khuyến mãi + lọc theo type, isActive
router.get("/", getPromotions)

// ✅ Lấy chi tiết khuyến mãi theo ID
router.get("/:id", getPromotionById)

// ✅ Cập nhật khuyến mãi
router.put("/:id", updatePromotion)

// ✅ Xóa (soft delete)
router.delete("/:id", deletePromotion)
// ✅ Cập nhật trạng thái khuyến mãi
router.patch("/:id", updatePromotionStatus)

module.exports = router
