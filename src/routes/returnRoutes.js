const express = require("express");
const { createReturnRequest, getReturnRequest, acceptReturn, rejectReturn } = require("../controllers/returnController");
const router = express.Router();
const multer = require("multer");


const upload = multer({ dest: "uploads/" });
// Tạo yêu cầu hoàn trả
router.post("/return", upload.single("image"), createReturnRequest);

// Lấy chi tiết hoàn trả theo orderId
router.get("/order/:orderId", getReturnRequest);

// Xử lý hoàn trả
router.patch("/acceptReturn/:id", acceptReturn);
router.patch("/rejectReturn/:id", rejectReturn);


module.exports = router;
