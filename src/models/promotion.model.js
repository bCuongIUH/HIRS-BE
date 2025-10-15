const mongoose = require("mongoose");

const promotionSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true }, // Mã tự động sinh
    title: { type: String, required: true },
    type: { type: String, enum: ["fixed", "percent"], required: true },
    minOrder: { type: Number, required: true },
    value: { type: Number, required: true },
    maxDiscount: { type: Number, default: null },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Tự động sinh code trước khi lưu
promotionSchema.pre("validate", function (next) {
  if (!this.code) {
    const randomCode = Math.floor(1000 + Math.random() * 9000); // số 4 chữ số ngẫu nhiên
    this.code = `KM-${randomCode}`;
  }
  next();
});

module.exports = mongoose.model("Promotion", promotionSchema);
