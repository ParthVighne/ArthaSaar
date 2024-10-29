const express = require("express");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cookieParser());

// Import routes
const authRoutes = require("./routes/authRoutes");
const poolRoutes = require("./routes/poolRoutes");
const userRoutes = require("./routes/userRoutes");
const transactionRoutes = require("./routes/transactionRoutes");

// Log incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} request to ${req.url}`);
  next();
});

// Test route
app.post("/test", (req, res) => {
  res.json({ message: "Test route is working!" });
});

// Set up routes
app.use("/api/auth", authRoutes);
app.use("/api/pools", poolRoutes);
app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);

module.exports = app;
