
const TransactionBook = require('../models/TransactionBook.model');
const Book = require('../models/book.model');
const User = require('../models/user.model')


// Lấy danh sách tất cả giao dịch
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await TransactionBook.find().populate('book createdBy');
    return res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
  }
};

// Lấy giao dịch theo ID
exports.getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await TransactionBook.findById(id).populate('book createdBy');
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Giao dịch không tồn tại!' });
    }
    return res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
  }
};

// Xóa một giao dịch
exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await TransactionBook.findByIdAndDelete(id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Giao dịch không tồn tại!' });
    }

    // Cập nhật lại số lượng sách sau khi huỷ giao dịch
    const book = await Book.findById(transaction.book);
    if (transaction.transactionType === 'ban') {
      book.quantity += transaction.quantity;
    } else if (transaction.transactionType === 'nhap') {
      book.quantity -= transaction.quantity;
    }

    await book.save();

    return res.status(200).json({
      success: true,
      message: 'Xoá giao dịch thành công!',
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
  }
};
