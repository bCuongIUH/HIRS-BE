const Book = require("../models/book.model");
const Category = require("../models/category.model");
const cloudinary = require("../config/cloudinary");

exports.createBook = async (req, res) => {
  try {
    const { title, author, ISSN, category, price, publishYear, pages, description } = req.body;

    // Kiểm tra thể loại tồn tại
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ success: false, message: "Thể loại không tồn tại" });
    }

    // Upload ảnh lên Cloudinary nếu có
    let imageUrl = null;
    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "books",
      });
      imageUrl = uploadResult.secure_url;
    }

    // Tạo sách mới
    const newBook = await Book.create({
      title,
      author,
      ISSN,
      category,
      price,
      publishYear,
      pages,
      description,
      coverImage: imageUrl,
      isDelete: false, 
    });

    res.status(201).json({ success: true, data: newBook });
  } catch (error) {
    // ⚠️ Bắt lỗi trùng ISSN
    if (error.code === 11000 && error.keyPattern?.ISSN) {
      return res.status(400).json({
        success: false,
        message: `Mã ISSN "${error.keyValue.ISSN}" đã tồn tại, vui lòng nhập mã khác.`,
      });
    }

    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getBooks = async (req, res) => {
  try {

    const books = await Book.find({ isDelete: "false" }).populate("category", "name");
    res.status(200).json({ success: true, data: books });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: "Không tìm thấy sách" });
    } else {
      book.isDelete = "true";
      await book.save();
      return res.status(200).json({ success: true, message: "Xóa sách thành công" });
    }
  } catch {
    res.status(400).json({ success: false, message: error.message });
  }
}
exports.updateBook = async (req, res) => {
    console.log(req.body);
console.log(req.file);

  try {
    // Nếu dùng multer (form-data) thì req.body có thể nằm trong req.body hoặc req.fields
    const data = req.body || req.fields || {};

    const {
      title,
      author,
      ISSN,
      category,
      price,
      publishYear,
      pages,
      description,
    } = data;

    // Kiểm tra sách tồn tại
    const book = await Book.findOne({ _id: req.params.id, isDelete: false });
    if (!book) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy sách hoặc đã bị xóa" });
    }

    // Nếu có file ảnh mới thì upload
    let imageUrl = book.coverImage;
    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "books",
      });
      imageUrl = uploadResult.secure_url;
    }

    // Cập nhật dữ liệu
    book.title = title || book.title;
    book.author = author || book.author;
    book.ISSN = ISSN || book.ISSN;
    book.category = category || book.category;
    book.price = price || book.price;
    book.publishYear = publishYear || book.publishYear;
    book.pages = pages || book.pages;
    book.description = description || book.description;
    book.coverImage = imageUrl;

    await book.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật sách thành công!",
      data: book,
    });
  } catch (error) {
    console.error("Lỗi cập nhật sách:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi cập nhật sách",
      error: error.message,
    });
  }
};
