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
    ref: "Employee", 
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  supplier: {
    type: String,
    required: true,
  },
  content: [
    {
      book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book",
        required: true,
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

// Tự động tính tổng tiền phiếu nhập
warehouseSchema.pre("save", function (next) {
  this.totalAmount = this.content.reduce((sum, item) => sum + item.total, 0);
  next();
});
warehouseSchema.pre("save", async function (next) {
  if (!this.code) {
    const count = await mongoose.model("Warehouse").countDocuments();
    this.code = `PNK${(count + 1).toString().padStart(4, "0")}`;
  }
  next();
});

//test số lượng vào kho
warehouseSchema.post("save", async function (doc) {
  const Book = mongoose.model("Book");
  for (const item of doc.content) {
    await Book.findByIdAndUpdate(item.book, {
      $inc: { stock: item.quantity },
    });
  }
});

module.exports = mongoose.model("Warehouse", warehouseSchema);
