const express = require("express");
const {
  register,
  login,
  logout,
  me,
} = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleWare");
const router = express.Router();

// Register Route
router.post("/register", register);

// Login Route
router.post("/login", login);

// Logout Route
router.post("/logout", logout);

// Get current user
router.get("/me", verifyToken, me);

module.exports = router;
