const express = require("express");
const { verifyToken } = require("../middleware/authMiddleWare");
const {
  createPool,
  getAllPools,
  getPoolDetails,
  addMemberToPool,
  deletePool,
  updatePoolDetails,
  removeMemberFromPool,
  changeMemberRole,
} = require("../controllers/poolController");
const router = express.Router();

// Create Pool Route
router.post("/create", verifyToken, createPool);

// All Pools Route
router.get("/", verifyToken, getAllPools);

// Get Pool Details Route
router.get("/:id", verifyToken, getPoolDetails);

// Add Member to Pool Route
router.post("/:id/addMember", verifyToken, addMemberToPool);

// Delete Pool Route
router.delete("/:id", verifyToken, deletePool);

// Update Pool Details Route
router.put("/:id", verifyToken, updatePoolDetails);

// Remove Member from Pool Route
router.post("/:id/removeMember", verifyToken, removeMemberFromPool);

// Change Member Role Route
router.post("/:id/changeRole", verifyToken, changeMemberRole);

module.exports = router;
