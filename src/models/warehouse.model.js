const mongoose = require("mongoose");

const warehouseSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  enteredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee", // hoặc User nếu bạn dùng user làm người nhập
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  content: [
    {
      book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book",
        required: true,
      },
      volume: {
        type: String, 
        default: null,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      importPrice: {
        type: Number,
        required: true,
        min: 0,
      },
      total: {
        type: Number,
        required: true,
        min: 0,
      },
    },
  ],
  totalAmount: {
    type: Number,
    default: 0,
  },
});

// ✅ Tự động tính tổng tiền phiếu nhập
warehouseSchema.pre("save", function (next) {
  this.totalAmount = this.content.reduce((sum, item) => sum + item.total, 0);
  next();
});

// ✅ Sau khi lưu, cập nhật số lượng tồn kho cho từng sách
warehouseSchema.post("save", async function (doc) {
  const Book = mongoose.model("Book");
  for (const item of doc.content) {
    await Book.findByIdAndUpdate(item.book, { $inc: { stock: item.quantity } });
  }
});
// ✅ Tự động sinh mã phiếu nhập (VD: PNK20251015-001)
warehouseSchema.pre("validate", async function (next) {
  if (!this.code) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const dateCode = `${yyyy}${mm}${dd}`;

    const Warehouse = mongoose.model("Warehouse");

    // Tìm phiếu nhập cuối cùng trong ngày hôm nay
    const lastEntry = await Warehouse.findOne({
      code: { $regex: `^PNK${dateCode}-` },
    }).sort({ code: -1 });

    let nextNumber = 1;
    if (lastEntry) {
      const lastNumber = parseInt(lastEntry.code.split("-")[1]);
      nextNumber = lastNumber + 1;
    }

    this.code = `PNK${dateCode}-${String(nextNumber).padStart(3, "0")}`;
  }
  next();
});
module.exports = mongoose.model("Warehouse", warehouseSchema);
