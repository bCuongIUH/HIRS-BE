const express = require("express");
const { getAllTransactions } = require("../controllers/TransactionBook.controller");
const router = express.Router();


router.get("/", getAllTransactions);

module.exports = router;
