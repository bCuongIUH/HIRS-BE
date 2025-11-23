// models/TransactionBook.js
const mongoose = require('mongoose');

// Schema cho TransactionBook
const transactionBookSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',  
    required: true,
  },
  transactionType: {
    type: String,
    enum: ['ban', 'nhap', 'huy', 'kiem_kho'],  // Các loại giao dịch
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  transactionDate: {
    type: Date,
    default: Date.now,  // Lưu thời gian giao dịch
  },
  description: {
    type: String,  // Có thể là mô tả cho giao dịch (ví dụ: lý do huỷ, bán...)
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // Người thực hiện giao dịch
    required: true,
  },
});

const TransactionBook = mongoose.model('TransactionBook', transactionBookSchema);

module.exports = TransactionBook;
