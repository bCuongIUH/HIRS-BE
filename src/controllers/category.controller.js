const Category = require("../models/category.model");

// Tạo thể loại
exports.createCategory = async (req, res) => {
  try {
    const category = await Category.create({ name: req.body.name });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Lấy tất cả thể loại
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
