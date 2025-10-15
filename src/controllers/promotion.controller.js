const Promotion = require("../models/promotion.model");

// Thêm 1 chương trình khuyến mãi
exports.createPromotion = async (req, res) => {
  try {
    const { title, type, minOrder, value, maxDiscount, startDate, endDate, status } = req.body;

    if (!title || !type || !minOrder || !value || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: "Vui lòng điền đầy đủ thông tin!" });
    }

    const newPromo = await Promotion.create({
      title,
      type,
      minOrder,
      value,
      maxDiscount: type === "percent" ? maxDiscount || null : null,
      startDate,
      endDate,
      status: status || "active",
      // code sẽ được tự động sinh trong pre validate
    });

    res.status(201).json({ success: true, message: "Tạo khuyến mãi thành công!", data: newPromo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// Lấy danh sách khuyến mãi (chỉ lấy isDeleted = false)
exports.getAllPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.find({ isDeleted: false }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: promotions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// Xóa mềm khuyến mãi
exports.deletePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const promo = await Promotion.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (!promo) return res.status(404).json({ success: false, message: "Khuyến mãi không tồn tại" });

    res.status(200).json({ success: true, message: "Xóa khuyến mãi thành công", data: promo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
