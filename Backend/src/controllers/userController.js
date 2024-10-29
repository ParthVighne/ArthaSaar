const db = require("../config/db");

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const [results] = await db.query(
      "SELECT user_id, user_name, email, balance, created_at FROM users"
    );
    res.status(200).json({ users: results });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Failed to retrieve users", error: err });
  }
};

// Get details of a specific user
exports.getUserById = async (req, res) => {
  const userId = req.params.id;

  try {
    const [results] = await db.query(
      "SELECT user_id, user_name, email, balance, created_at FROM users WHERE user_id = ?",
      [userId]
    );

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user: results[0] });
  } catch (err) {
    console.error("Error fetching user by ID:", err);
    res.status(500).json({ message: "Failed to retrieve user", error: err });
  }
};

// Update user profile details
exports.updateUserProfile = async (req, res) => {
  const userId = req.params.id;
  const { user_name, email, balance } = req.body;

  // Prepare update fields dynamically
  let updateFields = [];
  let updateValues = [];

  if (user_name) {
    updateFields.push("user_name = ?");
    updateValues.push(user_name);
  }

  if (email) {
    updateFields.push("email = ?");
    updateValues.push(email);
  }

  if (balance !== undefined) {
    updateFields.push("balance = ?");
    updateValues.push(balance);
  }

  if (updateFields.length === 0) {
    return res.status(400).json({ message: "No valid fields to update" });
  }

  // Construct query
  updateValues.push(userId);
  const query = `UPDATE users SET ${updateFields.join(", ")} WHERE user_id = ?`;

  try {
    await db.query(query, updateValues);
    res.status(200).json({ message: "User profile updated successfully" });
  } catch (err) {
    console.error("Error updating user profile:", err);
    res.status(500).json({ message: "Failed to update user", error: err });
  }
};
