const db = require("../config/db");
const bcrypt = require("bcryptjs");

// Utility function to find a user by email
exports.findUserByEmail = (email, callback) => {
  const query = "SELECT * FROM users WHERE email = ?";
  db.query(query, [email], (err, results) => {
    callback(err, results);
  });
};

// Utility function to create a new user
exports.createUser = async (user_name, email, password, callback) => {
  // Encrypt the password
  const hashedPassword = await bcrypt.hash(password, 10);

  const query =
    "INSERT INTO users (user_name, email, password) VALUES (?, ?, ?)";
  db.query(query, [user_name, email, hashedPassword], (err, result) => {
    callback(err, result);
  });
};

// Utility function to verify user password
exports.verifyPassword = async (enteredPassword, storedPassword) => {
  return await bcrypt.compare(enteredPassword, storedPassword);
};
