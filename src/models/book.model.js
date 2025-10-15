const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  author: {
    type: String,
    required: true,
  },
  ISSN: {
    type: String,
    trim: true,
    unique: true,
    sparse: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  publishYear: {
    type: Number,
  },
  pages: {
    type: Number,
  },
  coverImage: {
    type: String,
  },
  description: {
    type: String,
  },
  volume: {
    type: String, // Có thể để Number nếu bạn muốn
    default: null, // Sách không có tập thì để null
  },
  isDelete: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Book", bookSchema);
