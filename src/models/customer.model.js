const mongoose = require("mongoose")

const CustomerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fullName: {
      type: String,
      required: [true, "Vui lòng nhập họ tên khách hàng"],
    },
    gender: {
      type: String,
      enum: ["Nam", "Nữ", "Khác"],
      default: "Khác",
    },
    phone: {
      type: String,
      required: [true, "Vui lòng nhập số điện thoại"],
    },
    email: {
      type: String,
      required: [true, "Vui lòng nhập email"],
    },
    birthday: {
      type: Date,
    },
   address: {
      type: [
        {
          address: { type: String, required: true },
          isDeleted: { type: Boolean, default: false }
        }
      ],
      default: []
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

module.exports = mongoose.model("Customer", CustomerSchema)
