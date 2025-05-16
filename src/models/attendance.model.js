const mongoose = require("mongoose")

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    timeIn: {
      type: Date,
      default: null,
    },
    timeOut: {
      type: Date,
      default: null,
    },
    totalHours: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["present", "absent", "late", "early_leave", "incomplete"],
      default: "incomplete",
    },
    notes: {
      type: String,
    },
    location: {
      type: {
        latitude: Number,
        longitude: Number,
        address: String,
      },
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

// Đảm bảo mỗi nhân viên chỉ có một bản ghi chấm công cho mỗi ngày
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true })

module.exports = mongoose.model("Attendance", attendanceSchema)
