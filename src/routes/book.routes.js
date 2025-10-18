const express = require("express");
const router = express.Router();
const multer = require("multer");
const { createBook, getBooks, deleteBook, updateBook, getBookById } = require("../controllers/book.controller");

const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("coverImage"), createBook);
router.get("/", getBooks);
router.get("/:id", getBookById);
router.put("/:id", deleteBook);
router.patch("/:id", upload.single("coverImage"), updateBook);
module.exports = router;
