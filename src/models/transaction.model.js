const mongoose = require("mongoose")

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: ["create", "update", "delete", "login", "logout", "other"],
    },
    module: {
      type: String,
      required: true,
      enum: ["employee", "department", "payroll", "attendance", "user", "system"],
    },
    description: {
      type: String,
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "targetModel",
    },
    targetModel: {
      type: String,
      enum: ["User", "Employee", "Department", "Payroll", "Attendance"],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Transaction", transactionSchema)
