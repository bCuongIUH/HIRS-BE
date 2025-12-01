const express = require("express")
const router = express.Router()
const orderController = require("../controllers/order.controller")

router.post("/", orderController.createOrder)
router.get("/", orderController.getAllOrders)

// ⚠️ Đặt các route cụ thể lên TRƯỚC route động
router.get("/vnpay_ipn", orderController.vnpayIpn)
router.get("/orderCode/:orderCode", orderController.getOrderByCode)
router.get("/user/:userId", orderController.getOrdersByUser)
router.put("/status/:id", orderController.updateOrderStatus)
router.put("/status/rejectOrder/:id", orderController.rejectOrder)
router.put("/status/cancelOrder/:id", orderController.cancelOrder)
router.delete("/:id", orderController.deleteOrder)
router.get("/:id", orderController.getOrderById)

router.post("/checkout", orderController.createOrderAndVNPayUrl)

module.exports = router
