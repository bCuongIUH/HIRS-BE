const Return = require("../models/ReturnModel");
const Order = require("../models/order.model");
const cloudinary = require("../config/cloudinary");
const ReturnModel = require("../models/ReturnModel");
const orderModel = require("../models/order.model");

// Tạo yêu cầu hoàn trả
exports.createReturnRequest = async (req, res) => {
  try {
    console.log("req.body:", req.body);
    console.log("req.file:", req.file);

    const { orderId, requestedBy, reason } = req.body;
    if (!orderId || !requestedBy || !reason) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin yêu cầu" });
    }

    let imageUrl = null;
    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "books",
      });
      console.log("uploadResult:", uploadResult);
      imageUrl = uploadResult.secure_url;
    }

    const newReturn = await Return.create({
      orderId,
      requestedBy,
      reason,
      images: imageUrl,
      status: "pending",
    });

    res.status(201).json({ success: true, data: newReturn });
  } catch (err) {
    console.error("Error in createReturnRequest:", err);
    res.status(500).json({ success: false, message: "Lỗi tạo yêu cầu hoàn trả" });
  }
};

/**
 * Lấy chi tiết yêu cầu hoàn trả theo orderId
 */
exports.getReturnRequest = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Lấy thông tin Return
    const returnRequest = await Return.findOne({ orderId })
      .populate("requestedBy", "name email")
    //   .populate("handledBy", "name email");

    if (!returnRequest) {
      return res.status(404).json({ success: false, message: "Không tìm thấy yêu cầu hoàn trả" });
    }

    // Lấy thông tin Order gốc để lấy subtotal, shippingFee, tax, total
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng gốc" });
    }

    // Trả về cả dữ liệu Return + thông tin tổng tiền
    res.json({
      success: true,
      data: {
        ...returnRequest.toObject(),
        subtotal: order.subtotal,
        shippingFee: order.shippingFee,
        tax: order.tax,
        total: order.total,
        items: order.items,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi khi lấy yêu cầu hoàn trả" });
  }
};

//cập nhật trạng thái hoàn trả
exports.acceptReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userName } = req.body; 
    //   const userId = req.user._id;
    // const userName = req.user.name || 'Unknown User';


const STATUS_FLOW = ["pending", "accepted", "checking", "completed", "rejected"];

   const returnRequest = await ReturnModel.findOne({ orderId: id }); 

    if (!returnRequest) {
      return res.status(404).json({ success: false, message: "Không tìm thấy yêu cầu" });
    }

    const currentIndex = STATUS_FLOW.indexOf(returnRequest.status);
    if (currentIndex === -1 || currentIndex >= STATUS_FLOW.length - 1) {
      return res.status(400).json({ success: false, message: "Không thể tiếp nhận trạng thái tiếp theo" });
    }

    const nextStatus = STATUS_FLOW[currentIndex + 1];
    returnRequest.status = nextStatus;

    returnRequest.statusHistory.push({
      status: nextStatus,
      updatedBy: userId,
      updatedByName: userName || 'Unknown User',
      updatedAt: new Date()
    });

    await returnRequest.save();
     // Nếu trạng thái yêu cầu hoàn trả là "completed", cập nhật trạng thái đơn hàng thành "paid"
    if (nextStatus === "completed") {
      const order = await orderModel.findOne({ _id: id });
      if (order) {
        order.status = "paid"; // Cập nhật trạng thái đơn hàng thành "paid"
        await order.save();
      }
    }
    res.json({ success: true, data: returnRequest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};


//từ chối 
exports.rejectReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userName } = req.body; 

   const returnRequest = await ReturnModel.findOne({ orderId: id }); 
    if (!returnRequest) return res.status(404).json({ success: false, message: "Không tìm thấy yêu cầu" });

    returnRequest.status = "rejected";
    returnRequest.statusHistory.push({
      status: "rejected",
      updatedBy: userId,
      updatedByName: userName,
    });
    

    await returnRequest.save();
    // Cập nhật trạng thái đơn hàng gốc sang "cancelled"
    const order = await orderModel.findById(returnRequest.orderId);
    if (order) {
      order.status = "cancelled";
      order.statusHistory.push({
        status: "cancelled",
        updatedBy: userId,
        updatedByName: userName,
      });
      await order.save();
    }
    res.json({ success: true, data: returnRequest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
