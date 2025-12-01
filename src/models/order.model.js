const mongoose = require("mongoose")

const OrderSchema = new mongoose.Schema(
  {
    orderCode: { type: String, required: true, unique: true },
   user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: false,
    },

    // Danh sách sản phẩm
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Book",
          required: true,
        },
        title: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        total: { type: Number, required: true }, // price * quantity
        image: { type: String, default: null },
      },
    ],

    // Địa chỉ giao hàng
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
      address: { type: String, required: true },
      ward: { type: String, required: true },
      district: { type: String, required: true },
      city: { type: String, required: true },
      notes: { type: String , default :"Không"},
    },

    // Thanh toán & tổng tiền
    subtotal: { type: Number, required: true },
    shippingFee: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },

    // Phương thức thanh toán
    paymentMethod: {
      type: String,
      enum: ["cod", "bank_transfer","vnpay"],
      default: "cod",
    },

    // Trạng thái đơn hàng
    status: {
      type: String,
      enum: ["pending", "processing", "shipping", "delivered", "cancelled","yeu_cau_hoan_tra","paid","completed","tuchoi","huydonhang"],
      default: "pending",
    },
    // Lịch sử cập nhật trạng thái
    statusHistory: [
      {
        status: { type: String, required: true },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
         updatedByName: { type: String },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
 
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
)

module.exports = mongoose.model("Order", OrderSchema)
