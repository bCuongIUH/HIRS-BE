const Order = require("../models/order.model")
const Book = require("../models/book.model") // import Book

// 🧾 Tạo đơn hàng mới
exports.createOrder = async (req, res) => {
  try {
    const {
      orderCode,
      user,
      items,
      shippingAddress,
      subtotal,
      shippingFee,
      tax,
      total,
      paymentMethod,
    } = req.body
    console.log("📦 Dữ liệu nhận từ FE:", req.body) 

    // Validate
    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: "Giỏ hàng trống!" })
    }
    if (!shippingAddress) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin địa chỉ giao hàng!" })
    }

    // Chuyển đổi items
    const formattedItems = items.map((item) => ({
      productId: item.productId,
      title: item.title,
      price: item.price,
      quantity: item.quantity,
      total: item.price * item.quantity,
     image: item.image || Book?.coverImage || null, 
    }))

    // Tạo đơn hàng
    const newOrder = await Order.create({
      orderCode,
      user: user || null,
      items: formattedItems,
      shippingAddress,
      subtotal,
      shippingFee,
      tax,
      total,
      paymentMethod,
    })

    // 🔥 Trừ stock của từng sách
    await Promise.all(
      formattedItems.map(async (item) => {
        const book = await Book.findById(item.productId)
        if (book) {
          book.stock = Math.max(book.stock - item.quantity, 0) // tránh âm stock
          await book.save()
        }
      })
    )

    res.status(201).json({
      success: true,
      message: "Tạo đơn hàng thành công!",
      order: newOrder,
    })
  } catch (error) {
    console.error("❌ Lỗi tạo đơn hàng:", error)
    res.status(500).json({ success: false, message: "Lỗi server", error: error.message })
  }
}

// 📦 Lấy tất cả đơn hàng
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({ isDeleted: false }).sort({ createdAt: -1 })
    res.status(200).json({ success: true, orders })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// 🔍 Lấy đơn hàng theo ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng!" })
    res.status(200).json({ success: true, order })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// 🗑️ Xoá mềm đơn hàng
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng!" })

    order.isDeleted = true
    await order.save()

    res.status(200).json({ success: true, message: "Đơn hàng đã được xoá!" })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
//lấy đơn hàng theo user
exports.getOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, message: "Thiếu userId!" });
    }

    // Tìm tất cả đơn hàng của user
    const orders = await Order.find({ user: userId, isDeleted: false }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("❌ Lỗi lấy đơn hàng của user:", error);
    res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};
//lấy đơn hàng theo code
exports.getOrderByCode = async (req, res) => {
  try {
    const { orderCode } = req.body; // hoặc req.params.orderCode
    const order = await Order.findOne({ orderCode, isDeleted: false });

    if (!order) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng!" });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/orders/:id/status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params

    const statusFlow = [
      "pending",
      "processing",
      "shipping",
      "delivered",
      "yeu_cau_hoan_tra",
    ]

    // Lấy đơn hàng
    const order = await Order.findById(id)
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng!",
      })
    }

    const currentStatus = order.status
    const currentIndex = statusFlow.indexOf(currentStatus)

    if (currentIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái đơn hàng không hợp lệ!",
      })
    }

    if (currentIndex === statusFlow.length - 1) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái đã ở mức cuối cùng, không thể cập nhật!",
      })
    }

    // Cập nhật sang trạng thái tiếp theo
    const nextStatus = statusFlow[currentIndex + 1]
    order.status = nextStatus
    await order.save()

    return res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái thành công!",
      status: nextStatus,
      order,
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({
      success: false,
      message: "Lỗi server!",
      error: err.message,
    })
  }
}