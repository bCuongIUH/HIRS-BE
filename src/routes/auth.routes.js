const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

// Public routes
router.post("/login", authController.login);
router.get("/logout", authController.logout);
router.get("/me", authController.getMe);
router.post("/forgotpassword", authController.forgotPassword);
router.put("/resetpassword/:resettoken", authController.resetPassword);

// Protected routes
router.put("/updatedetails", authController.updateDetails);
router.put("/updatepassword", authController.updatePassword);

module.exports = router; // ✅ NHỚ export router
