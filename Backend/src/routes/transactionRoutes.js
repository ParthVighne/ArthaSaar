const express = require("express");
const {
  createTransaction,
  getUserTransactionHistory,
  getPoolTransactionHistory,
} = require("../controllers/transactionController");
const router = express.Router();

// Create a new transaction
router.post("/", createTransaction);

// Get user transaction history
router.get("/user/:id", getUserTransactionHistory);

// Get pool transaction history
router.get("/pool/:id", getPoolTransactionHistory);

module.exports = router;
