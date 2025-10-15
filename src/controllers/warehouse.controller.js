const Warehouse = require("../models/warehouse.model");
const Book = require("../models/book.model");

// 🧾 Tạo phiếu nhập kho (nhiều sản phẩm)
exports.createWarehouseEntry = async (req, res) => {
  console.log("📦 BODY NHẬN ĐƯỢC:", req.body);

  try {
    const { enteredBy, content } = req.body;

    if ( !enteredBy || !content) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc!",
      });
    }

    const totalAmount = content.reduce(
      (sum, item) => sum + item.quantity * item.importPrice,
      0
    );

    const warehouse = await Warehouse.create({
    
      enteredBy,
      content: content.map((item) => ({
        ...item,
        total: item.quantity * item.importPrice,
      })),
      totalAmount,
    });

    res.status(201).json({
      success: true,
      message: "Tạo phiếu nhập kho thành công!",
      data: warehouse,
    });
  } catch (error) {
    console.error("❌ Lỗi khi tạo phiếu nhập kho:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi tạo phiếu nhập kho.",
      error: error.message,
    });
  }
};


// 📋 Lấy tất cả phiếu nhập
exports.getAllWarehouses = async (req, res) => {
  try {
    const warehouses = await Warehouse.find()
      .populate("enteredBy", "name")
      .populate("content.book", "title author ISSN")
      .sort({ date: -1 });

    res.json({ success: true, data: warehouses });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách phiếu nhập.",
    });
  }
};

// 🔍 Lấy chi tiết phiếu nhập theo ID
exports.getWarehouseById = async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id)
      .populate("enteredBy", "name")
      .populate("content.book", "title author ISSN category");

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phiếu nhập.",
      });
    }

    res.json({ success: true, data: warehouse });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy chi tiết phiếu nhập.",
    });
  }
};
