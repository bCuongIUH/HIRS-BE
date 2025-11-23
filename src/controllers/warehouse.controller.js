const Warehouse = require("../models/warehouse.model");
const Book = require("../models/book.model");
const TransactionBook = require("../models/TransactionBook.model");

// 🧾 Tạo phiếu nhập kho (nhiều sản phẩm)
// exports.createWarehouseEntry = async (req, res) => {
//   console.log("📦 BODY NHẬN ĐƯỢC:", req.body);

//   try {
//     const { enteredBy, content } = req.body;

//     if ( !enteredBy || !content) {
//       return res.status(400).json({
//         success: false,
//         message: "Thiếu thông tin bắt buộc!",
//       });
//     }

//     const totalAmount = content.reduce(
//       (sum, item) => sum + item.quantity * item.importPrice,
//       0
//     );

//     const warehouse = await Warehouse.create({
    
//       enteredBy,
//       content: content.map((item) => ({
//         ...item,
//         total: item.quantity * item.importPrice,
//       })),
//       totalAmount,
//     });

//     res.status(201).json({
//       success: true,
//       message: "Tạo phiếu nhập kho thành công!",
//       data: warehouse,
//     });
    
//   } catch (error) {
//     console.error("❌ Lỗi khi tạo phiếu nhập kho:", error);
//     res.status(500).json({
//       success: false,
//       message: "Đã xảy ra lỗi khi tạo phiếu nhập kho.",
//       error: error.message,
//     });
//   }
// };

exports.createWarehouseEntry = async (req, res) => {
  console.log("📦 BODY NHẬN ĐƯỢC:", req.body);

  try {
    const { enteredBy, content } = req.body;

    // Kiểm tra nếu thiếu thông tin bắt buộc
    if (!enteredBy || !content) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc!",
      });
    }

    // Tính tổng giá trị nhập kho
    const totalAmount = content.reduce(
      (sum, item) => sum + item.quantity * item.importPrice,
      0
    );

    // Tạo phiếu nhập kho
    const warehouse = await Warehouse.create({
      enteredBy,
      content: content.map((item) => ({
        ...item,
        total: item.quantity * item.importPrice,
      })),
      totalAmount,
    });

      // Tạo giao dịch nhập kho trong TransactionBook
      const transactionPromises = content.map(async (item) => {
        await TransactionBook.create({
          book: item.book, 
          transactionType: 'nhap', 
          quantity: item.quantity,
          transactionDate: new Date(),
          description: `Nhập kho cuốn sách ${item.bookTitle} (tập ${item.volume})`,
        });
      });

      // Chờ tất cả các giao dịch được tạo xong
      await Promise.all(transactionPromises);

    // Trả về phản hồi thành công
    res.status(201).json({
      success: true,
      message: "Tạo phiếu nhập kho và giao dịch thành công!",
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
    const data = await Warehouse.find()
      .populate({
        path: "enteredBy",
        select: "firstName lastName email phone avatar",
      })
      .populate({
        path: "content.book",
        select: "title author ISSN",
      })

    const formatted = data.map(item => ({
      id: item._id,
      code: item.code,
      date: item.date,
      enteredBy:
        item.enteredBy
          ? `${item.enteredBy.lastName} ${item.enteredBy.firstName}`
          : "Không xác định",
      totalAmount: item.totalAmount,
      totalBooks: item.content.length,
      content: item.content,
    }))

    res.json({ success: true, data: formatted })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "Lỗi server!" })
  }
}


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
