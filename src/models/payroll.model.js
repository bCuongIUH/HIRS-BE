const mongoose = require("mongoose")

const payrollSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    period: {
      month: {
        type: Number,
        required: true,
        min: 1,
        max: 12,
      },
      year: {
        type: Number,
        required: true,
      },
    },
    workingDays: {
      standard: {
        type: Number,
        required: true,
        default: 22,
      },
      actual: {
        type: Number,
        required: true,
      },
      overtime: {
        type: Number,
        default: 0,
      },
    },
    salary: {
      baseSalary: {
        type: Number,
        required: true,
      },
      dailyRate: {
        type: Number,
        required: true,
      },
      regularSalary: {
        type: Number,
        required: true,
      },
      overtimePay: {
        type: Number,
        default: 0,
      },
    },
    allowances: [
      {
        name: {
          type: String,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
      },
    ],
    deductions: [
      {
        name: {
          type: String,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
      },
    ],
    totalAllowances: {
      type: Number,
      required: true,
    },
    totalDeductions: {
      type: Number,
      required: true,
    },
    grossSalary: {
      type: Number,
      required: true,
    },
    netSalary: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "pending", "approved", "paid", "cancelled"],
      default: "draft",
    },
    paymentDate: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      enum: ["bank_transfer", "cash", "check", "other"],
    },
    paymentReference: {
      type: String,
    },
    notes: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

// Đảm bảo mỗi nhân viên chỉ có một bảng lương cho mỗi kỳ lương
payrollSchema.index({ employee: 1, "period.month": 1, "period.year": 1 }, { unique: true })

module.exports = mongoose.model("Payroll", payrollSchema)
