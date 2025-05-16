const express = require("express")
const {
  getTransactions,
  getRecentTransactions,
  createTransaction,
  markAsRead,
  markAllAsRead,
} = require("../controllers/transaction.controller")

const Transaction = require("../models/transaction.model")

const router = express.Router()

const advancedResults = require("../middleware/advancedResults.middleware")
const { protect } = require("../middleware/auth.middleware")

// Áp dụng middleware bảo vệ cho tất cả các routes
router.use(protect)

router.route("/recent").get(getRecentTransactions)
router.route("/read-all").put(markAllAsRead)
router.route("/:id/read").put(markAsRead)

router
  .route("/")
  .get(
    advancedResults(Transaction, {
      path: "user",
      select: "name",
    }),
    getTransactions,
  )
  .post(createTransaction)

module.exports = router
