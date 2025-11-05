require("dotenv").config();
const Order = require("../models/order.model")
const Book = require("../models/book.model") 
const querystring = require("qs");
const crypto = require("crypto");
const qs = require("qs");
const dateFormat = require("dateformat"); 
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
    // const { orderCode } = req.body;
     const { orderCode } = req.params;
     
    // const order = await Order.findOne({ orderCode, isDeleted: false });
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


// Khi VNPay gửi kết quả thanh toán về server của bạn
exports.createOrderAndVNPayUrl = async (req, res) => {
  try {
    const dateFormat = (await import("dateformat")).default;
    const { items, shippingAddress, paymentMethod, subtotal, shippingFee, tax, total } = req.body;

    console.log("=== 🟢 [FE gửi lên BE] Dữ liệu nhận được ===");
    console.log(req.body);

    // ✅ Tính total từng item nếu FE chưa có
    const itemsWithTotal = items.map(item => ({
      ...item,
      total: item.total || item.price * item.quantity
    }));

    // ✅ Nếu FE gửi subtotal, shippingFee, tax, total thì dùng luôn
    const finalSubtotal =
      typeof subtotal === "number"
        ? subtotal
        : itemsWithTotal.reduce((sum, i) => sum + i.total, 0);
    const finalShippingFee = typeof shippingFee === "number" ? shippingFee : 0;
    const finalTax = typeof tax === "number" ? tax : 0;
    const finalTotal =
      typeof total === "number"
        ? total
        : finalSubtotal + finalShippingFee + finalTax;

    const orderCode = "ORD-" + Date.now();

    const newOrder = new Order({
      user: req.body.user,
      orderCode,
      items: itemsWithTotal,
      shippingAddress,
      subtotal: finalSubtotal,
      shippingFee: finalShippingFee,
      tax: finalTax,
      total: finalTotal,
      paymentMethod,
      status: "pending",
    });

    await newOrder.save();
 
    // ✅ Nếu thanh toán VNPay hoặc chuyển khoản
    if (paymentMethod === "vnpay" || paymentMethod === "bank_transfer") {
      const tmnCode = process.env.VNP_TMNCODE;
      const secretKey = process.env.VNP_HASHSECRET;
      const vnpUrl = process.env.VNP_URL;
      const returnUrl = process.env.VNP_RETURNURL;
      const date = new Date();
      const createDate = dateFormat(date, "yyyymmddHHMMss");
      const orderId = orderCode;

      let ipAddr = req.ip || req.connection.remoteAddress || "127.0.0.1";
      if (ipAddr.startsWith("::ffff:")) ipAddr = ipAddr.replace("::ffff:", "");
      if (ipAddr === "::1") ipAddr = "127.0.0.1";

      let vnp_Params = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode: tmnCode,
        vnp_Locale: "vn",
        vnp_CurrCode: "VND",
        vnp_TxnRef: orderId,
        vnp_OrderInfo: "Thanh-toan-" + orderCode,
        vnp_OrderType: "billpayment",
        vnp_Amount: finalTotal * 100, // ✅ Dùng total cuối cùng (VD: 96,000)
        vnp_ReturnUrl: returnUrl,
        vnp_CreateDate: createDate,
        vnp_IpAddr: ipAddr,
      };

      vnp_Params = sortObject(vnp_Params);

      const signData = querystring.stringify(vnp_Params, { encode: true });
      const hmac = crypto.createHmac("sha512", secretKey);
      const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
      vnp_Params["vnp_SecureHash"] = signed;

      const paymentUrl =
        vnpUrl + "?" + querystring.stringify(vnp_Params, { encode: true });

      return res.status(200).json({
        code: "00",
        message: "success",
        orderId: newOrder._id,
        paymentUrl,
      });
    }

    // ✅ Nếu COD
    res.status(200).json({
      code: "00",
      message: "Order created successfully",
      orderId: newOrder._id,
      total: finalTotal,
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

exports.vnpayIpn = async (req, res) => {
  try {
    const vnp_Params = { ...req.query };
    const secureHash = vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    const secretKey = process.env.VNP_HASHSECRET;

    // ✅ Sắp xếp và stringify giống phần tạo order
    const sortedParams = sortObject(vnp_Params);
    const signData = querystring.stringify(sortedParams, { encode: true });
    const hmac = crypto.createHmac("sha512", secretKey);
    const checkSum = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    // So sánh chữ ký
    if (secureHash === checkSum) {
      const orderId = vnp_Params["vnp_TxnRef"]; // = orderCode
      const responseCode = vnp_Params["vnp_ResponseCode"];

      // 🔍 Tìm order trong database
      const order = await Order.findOne({ orderCode: orderId });

      if (!order) {
        return res.status(200).json({ RspCode: "01", Message: "Order not found" });
      }
   // 🔒 Ngăn trừ kho 2 lần
      if (order.status === "delivered") {
        return res.status(200).json({ RspCode: "00", Message: "Already processed" });
      }
      if (responseCode === "00") {
        // ✅ Cập nhật trạng thái đơn
        order.status = "delivered";
        await order.save();

        // ✅ Trừ kho
        await Promise.all(
          order.items.map(async (item) => {
            const book = await Book.findById(item.productId);
            if (book) {
              book.stock = Math.max(book.stock - item.quantity, 0);
              await book.save();
            }
          })
        );

        console.log("✅ Đã trừ kho cho đơn:", order.orderCode);
        res.status(200).json({ RspCode: "00", Message: "Success" });
      } else {
        // ❌ Thanh toán thất bại
        order.status = "failed";
        await order.save();
        res.status(200).json({ RspCode: "00", Message: "Failed" });
      }
    } else {
      // ❌ Sai checksum
      res.status(200).json({ RspCode: "97", Message: "Checksum failed" });
    }
  } catch (err) {
    console.error("VNPay IPN error:", err);
    res.status(500).json({ RspCode: "99", Message: "Error" });
  }
};
