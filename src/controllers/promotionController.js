const Promotion = require("../models/Promotion")
const TransactionBook = require("../models/TransactionBook.model")
const Book = require("../models/book.model")
const Employee = require("../models/employee.model")

exports.createPromotion = async (req, res) => {
  try {
    const {
      type,
      title,
      bookId,
      discountAmount,
      discountPercent,
      maxDiscount,
      minOrderValue,
      createdByEmployeeId,
      startDate,
      endDate,
      description,
    } = req.body

    if (!type || !title) {
      return res.status(400).json({ message: "Loại khuyến mãi và tiêu đề là bắt buộc" })
    }

    if (!["fixed", "percent", "by-book"].includes(type)) {
      return res.status(400).json({ message: "Loại khuyến mãi không hợp lệ" })
    }

    if ((type === "fixed" || type === "percent") && !minOrderValue) {
      return res.status(400).json({ message: "Giá trị đơn hàng tối thiểu là bắt buộc" })
    }

    if ((type === "fixed" || type === "by-book") && discountAmount === undefined) {
      return res.status(400).json({ message: "Số tiền giảm là bắt buộc" })
    }

    if (type === "percent" && (discountPercent === undefined || maxDiscount === undefined)) {
      return res.status(400).json({ message: "Phần trăm giảm và giảm tối đa là bắt buộc" })
    }

    let originalPrice = 0
    let bookData = null

    if (type === "by-book") {
      if (!bookId) {
        return res.status(400).json({ message: "Vui lòng chọn sách" })
      }
      const book = await Book.findById(bookId)
      if (!book) {
        return res.status(404).json({ message: "Sách không tồn tại" })
      }
      originalPrice = book.price
      bookData = bookId
    }

    const employee = await Employee.findById(createdByEmployeeId)
    if (!employee) {
      return res.status(404).json({ message: "Nhân viên không tồn tại" })
    }

    const promotionData = {
      type,
      title,
      createdBy: createdByEmployeeId,
      startDate,
      endDate,
      description,
    }

    if (type === "by-book") {
      promotionData.book = bookData
      promotionData.originalPrice = originalPrice
      promotionData.discountAmount = discountAmount
    } else if (type === "fixed") {
      promotionData.minOrderValue = minOrderValue
      promotionData.discountAmount = discountAmount
    } else if (type === "percent") {
      promotionData.minOrderValue = minOrderValue
      promotionData.discountPercent = discountPercent
      promotionData.maxDiscount = maxDiscount
    }

    const promotion = new Promotion(promotionData)
    await promotion.save()

    await promotion.populate("book", "title price")
    await promotion.populate("createdBy", "firstName lastName email")

    res.status(201).json({
      message: "Tạo khuyến mãi thành công",
      data: promotion,
    })
  } catch (error) {
    console.error("[v0] Create promotion error:", error)
    res.status(500).json({ message: "Lỗi server", error: error.message })
  }
}

exports.getPromotions = async (req, res) => {
  try {
    const { type, isActive } = req.query

    const filter = { isDelete: false }
    if (type) filter.type = type
    if (isActive !== undefined) filter.isActive = isActive === "true"

    const promotions = await Promotion.find(filter)
      .populate("book", "title price")
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 })

    res.status(200).json({
      message: "Lấy danh sách khuyến mãi thành công",
      data: promotions,
    })
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message })
  }
}

exports.getPromotionById = async (req, res) => {
  try {
    const { id } = req.params

    const promotion = await Promotion.findById(id)
      .populate("book", "title price author category")
      .populate("createdBy", "firstName lastName email employeeId")

    if (!promotion || promotion.isDelete) {
      return res.status(404).json({ message: "Khuyến mãi không tồn tại" })
    }

    res.status(200).json({
      message: "Lấy chi tiết khuyến mãi thành công",
      data: promotion,
    })
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message })
  }
}

exports.updatePromotion = async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    if (updates.bookId && updates.type === "by-book") {
      const book = await Book.findById(updates.bookId)
      if (!book) {
        return res.status(404).json({ message: "Sách không tồn tại" })
      }
      updates.originalPrice = book.price
      updates.book = updates.bookId
      delete updates.bookId
    }

    const promotion = await Promotion.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })
      .populate("book", "title price")
      .populate("createdBy", "firstName lastName email")

    if (!promotion) {
      return res.status(404).json({ message: "Khuyến mãi không tồn tại" })
    }

    res.status(200).json({
      message: "Cập nhật khuyến mãi thành công",
      data: promotion,
    })
  } catch (error) {
    console.error("[v0] Update promotion error:", error)
    res.status(500).json({ message: "Lỗi server", error: error.message })
  }
}

exports.deletePromotion = async (req, res) => {
  try {
    const { id } = req.params

    const promotion = await Promotion.findByIdAndUpdate(id, { isDelete: true }, { new: true })

    if (!promotion) {
      return res.status(404).json({ message: "Khuyến mãi không tồn tại" })
    }

    res.status(200).json({
      message: "Xóa khuyến mãi thành công",
      data: promotion,
    })
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message })
  }
}

exports.getBooks = async (req, res) => {
  try {
    const books = await Book.find({ isDelete: false }).select("_id title price author category").sort({ title: 1 })

    res.status(200).json({
      message: "Lấy danh sách sách thành công",
      data: books,
    })
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message })
  }
}

exports.getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({ employmentStatus: "active" })
      .select("_id firstName lastName email employeeId")
      .sort({ firstName: 1 })

    res.status(200).json({
      message: "Lấy danh sách nhân viên thành công",
      data: employees,
    })
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message })
  }
}
//
// ✅ Update status Promotion
exports.updatePromotionStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    // Validate status hợp lệ
    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không hợp lệ!",
      })
    }

    const updatedPromotion = await Promotion.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )

    if (!updatedPromotion) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy chương trình khuyến mãi!",
      })
    }

    return res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái thành công!",
      promotion: updatedPromotion,
    })
  } catch (error) {
    console.error("Lỗi cập nhật trạng thái:", error)
    return res.status(500).json({
      success: false,
      message: "Lỗi Server!",
    })
  }
}