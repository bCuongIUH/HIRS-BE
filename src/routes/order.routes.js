const express = require("express")
const router = express.Router()
const orderController = require("../controllers/order.controller")

router.post("/", orderController.createOrder)
router.get("/", orderController.getAllOrders)
router.get("/:id", orderController.getOrderById)
router.delete("/:id", orderController.deleteOrder)
router.get("/user/:userId", orderController.getOrdersByUser);
router.post("/orderCode", orderController.getOrderByCode)
module.exports = router
