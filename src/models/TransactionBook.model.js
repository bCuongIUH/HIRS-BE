const mongoose = require('mongoose');


const transactionBookSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',  
    required: true,
  },
  transactionType: {
    type: String,
    enum: ['ban', 'nhap', 'huy', 'kiem_kho','khuyen_mai'], 
    required: true,
  },
  quantity: {
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
});

const TransactionBook = mongoose.model('TransactionBook', transactionBookSchema);

module.exports = TransactionBook;
