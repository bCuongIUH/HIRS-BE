require("dotenv").config();
const Order = require("../models/order.model")
const Book = require("../models/book.model") // import Book
const querystring = require("qs");
const crypto = require("crypto");

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

//
// Hàm sắp xếp object theo key
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = obj[key];
  }
  return sorted;
}

exports.createOrderAndVNPayUrl = async (req, res) => {
  try {
    const dateFormat = (await import("dateformat")).default;

    const { items, shippingAddress, paymentMethod } = req.body;

    // Tính total cho từng item
    const itemsWithTotal = items.map(item => ({
      ...item,
      total: item.price * item.quantity
    }));

    // Tính subtotal, total
    const subtotal = itemsWithTotal.reduce((sum, i) => sum + i.total, 0);
    const shippingFee = 0;
    const tax = 0;
    const total = subtotal + shippingFee + tax;

    const orderCode = "ORD-" + Date.now();

    const newOrder = new Order({
      orderCode,
      items: itemsWithTotal,
      shippingAddress,
      subtotal,
      shippingFee,
      tax,
      total,
      paymentMethod,
      status: "pending",
    });

    await newOrder.save();

    // Nếu thanh toán VNPay
    if (paymentMethod === "vnpay") {
      const tmnCode = process.env.VNP_TMNCODE;
      const secretKey = process.env.VNP_HASHSECRET;
      const vnpUrl = process.env.VNP_URL;
      const returnUrl = process.env.VNP_RETURNURL; // Không encode ở đây, encode khi tạo query string

      const date = new Date();
      const createDate = dateFormat(date, "yyyymmddHHMMss");
      const orderId = orderCode; // dùng orderCode làm reference

      // 1. Tham số raw để tạo chữ ký
      let vnp_Params = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode: tmnCode,
        vnp_Locale: "vn",
        vnp_CurrCode: "VND",
        vnp_TxnRef: orderId,
        vnp_OrderInfo: `Thanh toán đơn hàng ${orderCode}`,
        vnp_OrderType: "billpayment",
        vnp_Amount: total * 100,
        vnp_ReturnUrl: returnUrl,
        vnp_CreateDate: createDate,
        vnp_IpAddr: req.ip,
      };

      // 2. Sắp xếp key
      vnp_Params = sortObject(vnp_Params);

      // 3. Tạo chữ ký SHA512
      const signData = querystring.stringify(vnp_Params, { encode: false });
      const hmac = crypto.createHmac("sha512", secretKey);
      const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
      vnp_Params["vnp_SecureHash"] = signed;

      // 4. Tạo URL VNPay
      const paymentUrl = vnpUrl + "?" + querystring.stringify(vnp_Params, { encode: true });

      return res.status(200).json({
        code: "00",
        message: "success",
        orderId: newOrder._id,
        paymentUrl,
      });
    }

    // Nếu COD hoặc chuyển khoản
    res.status(200).json({
      code: "00",
      message: "Order created successfully",
      orderId: newOrder._id,
      total,
    });

  } catch (error) {
    console.error("❌ Lỗi tạo order + VNPay URL:", error);
    res.status(500).json({
      code: "99",
      message: "Lỗi tạo order hoặc VNPay URL",
      error: error.message,
    });
  }
};