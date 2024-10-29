const express = require("express");
const {
  getAllUsers,
  getUserById,
  updateUserProfile,
} = require("../controllers/userController");
const router = express.Router();

// Get all users
router.get("/", getAllUsers);

// Get specific user by ID
router.get("/:id", getUserById);

// Update user profile
router.put("/:id", updateUserProfile);

module.exports = router;
