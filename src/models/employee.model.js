const mongoose = require("mongoose")

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    firstName: {
      type: String,
      required: [true, "Vui lòng nhập tên"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Vui lòng nhập họ"],
      trim: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    phone: {
      type: String,
      required: [true, "Vui lòng nhập số điện thoại"],
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
    // position: {
    //   type: String,
    //   required: true,
    // },
    joinDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    employmentStatus: {
      type: String,
      enum: ["active", "on_leave", "terminated"],
      default: "active",
    },
    terminationDate: {
      type: Date,
    },
    // salary: {
    //   baseSalary: {
    //     type: Number,
    //     required: true,
    //   },
    //   allowances: [
    //     {
    //       name: String,
    //       amount: Number,
    //     },
    //   ],
    //   bankName: String,
    //   bankAccountNumber: String,
    //   bankAccountName: String,
    // },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
    },
    documents: [
      {
        name: String,
        type: String,
        url: String,
        uploadDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
)

// Tạo tên đầy đủ ảo
employeeSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`
})

// Đảm bảo virtuals được bao gồm khi chuyển đổi sang JSON
employeeSchema.set("toJSON", { virtuals: true })
employeeSchema.set("toObject", { virtuals: true })

module.exports = mongoose.model("Employee", employeeSchema)
