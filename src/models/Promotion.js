const mongoose = require("mongoose")

const promotionSchema = new mongoose.Schema(
  {
    code: {
  type: String,
  unique: true,
  default: () => "KM-" + Date.now()
},
    type: {
      type: String,
      enum: ["fixed", "percent", "by-book"],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: function () {
        return this.type === "by-book"
      },
    },

    originalPrice: {
      type: Number,
      required: function () {
        return this.type === "by-book"
      },
      default: 0,
    },

    discountAmount: {
      type: Number,
      required: function () {
        return this.type === "fixed" || this.type === "by-book"
      },
    },

    discountPercent: {
      type: Number,
      required: function () {
        return this.type === "percent"
      },
    },

    maxDiscount: {
      type: Number,
      required: function () {
        return this.type === "percent"
      },
    },

    sellingPrice: {
      type: Number,
      default: 0,
    },

    minOrderValue: {
      type: Number,
      required: function () {
        return this.type === "fixed" || this.type === "percent"
      },
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    description: {
      type: String,
      trim: true,
    },

    isDelete: {
      type: Boolean,
      default: false,
    },
    status: {
    type: String,
    enum: ["active", "inactive"],
    default: "inactive",
    }

  },
  {
    timestamps: true,
  },
)

promotionSchema.pre("save", function (next) {
  try {
    if (this.type === "fixed" || this.type === "by-book") {
      if (this.originalPrice && this.discountAmount !== undefined) {
        this.sellingPrice = this.originalPrice - this.discountAmount
      }
    } else if (this.type === "percent") {
      if (this.originalPrice && this.discountPercent !== undefined) {
        const discount = Math.min(
          (this.originalPrice * this.discountPercent) / 100,
          this.maxDiscount || Number.POSITIVE_INFINITY,
        )
        this.sellingPrice = this.originalPrice - discount
      }
    }
    next()
  } catch (error) {
    next(error)
  }
})

module.exports = mongoose.model("Promotion", promotionSchema)
