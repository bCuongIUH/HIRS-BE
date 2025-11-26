const mongoose = require("mongoose")

const returnRequestSchema = new mongoose.Schema(
    {
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
        requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },// người dùng
        reason: { type: String, required: true },
        description: { 
            type: String, 
            default: "" 
        },  // Mô tả chi tiết lý do (nếu có)
        images: [{ type: String }],
        status: {
            type: String,
            enum: ["pending", "accepted", "checking", "completed", "rejected"],
            default: "pending",
        },

        // Lịch sử các nhân viên xử lý
        statusHistory: [
            {
                status: { type: String, required: true },
                updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                updatedByName: { type: String },
                updatedAt: { type: Date, default: Date.now },
            },
        ],

        handledAt: { type: Date },
        notes: { type: String },
        requestedAt: { type: Date, default: Date.now }
    },
    { timestamps: true }
);
module.exports = mongoose.model("ReturnRequest", returnRequestSchema)