const express = require("express");
const router = express.Router();
const { createVNPayUrl } = require("../controllers/paymentController");

router.post("/create-vnpay-url", createVNPayUrl);
// router.get("/vnpay_ipn", vnpayIpn);

module.exports = router;
