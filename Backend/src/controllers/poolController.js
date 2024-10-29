const db = require("../config/db");

// Create Pool
exports.createPool = async (req, res) => {
  const { pool_name, description, members, created_by } = req.body;

  if (!pool_name || !created_by) {
    return res
      .status(400)
      .json({ message: "Pool name and creator are required" });
  }

  try {
    // Fetch user ID for the creator based on their email
    const [creatorResult] = await db.query(
      "SELECT user_id FROM users WHERE email = ?",
      [created_by]
    );
    if (creatorResult.length === 0) {
      return res
        .status(400)
        .json({ message: "Creator email is invalid or user does not exist" });
    }

    const creatorId = creatorResult[0].user_id;

    // Insert pool data using the creator's user ID
    const [poolResult] = await db.query(
      "INSERT INTO pools (pool_name, description, created_by, pool_balance, active) VALUES (?, ?, ?, 0, 1)",
      [pool_name, description, creatorId]
    );

    const poolId = poolResult.insertId;

    // If members are provided, check if they exist
    if (members && members.length > 0) {
      const [existingMembers] = await db.query(
        "SELECT user_id, email FROM users WHERE email IN (?)",
        [members]
      );

      const existingMemberEmails = existingMembers.map((user) => user.email);
      const nonExistentMembers = members.filter(
        (email) => !existingMemberEmails.includes(email)
      );

      // Add existing users as members to the pool
      const memberValues = existingMembers.map((user) => [
        poolId,
        user.user_id,
        user.email === created_by ? "admin" : "member",
      ]);

      if (memberValues.length > 0) {
        await db.query(
          "INSERT INTO pool_members (pool_id, user_id, role) VALUES ?",
          [memberValues]
        );
      }

      return res.status(201).json({
        message: "Pool created and members added successfully",
        poolId,
        nonExistentMembers:
          nonExistentMembers.length > 0 ? nonExistentMembers : undefined,
      });
    }

    res.status(201).json({ message: "Pool created successfully", poolId });
  } catch (err) {
    console.error("Error creating pool:", err);
    res.status(500).json({ message: "Failed to create pool", error: err });
  }
};

// Get all pools for the logged-in user
exports.getAllPools = async (req, res) => {
  const userId = req.user.user_id;

  try {
    const [pools] = await db.query(
      `SELECT p.* 
       FROM pools p
       JOIN pool_members pm ON p.pool_id = pm.pool_id
       WHERE pm.user_id = ? AND p.active = 1`,
      [userId]
    );

    if (pools.length === 0) {
      return res.status(200).json({ pools: [] });
    }

    const poolIds = pools.map((pool) => pool.pool_id);
    const [members] = await db.query(
      `SELECT pm.pool_id, u.email
       FROM pool_members pm
       JOIN users u ON pm.user_id = u.user_id
       WHERE pm.pool_id IN (?)`,
      [poolIds]
    );

    const poolsWithMembers = pools.map((pool) => ({
      ...pool,
      members: members
        .filter((member) => member.pool_id === pool.pool_id)
        .map((member) => member.email),
    }));

    res.status(200).json({ pools: poolsWithMembers });
  } catch (err) {
    console.error("Error fetching pools:", err);
    res.status(500).json({ message: "Failed to fetch pools", error: err });
  }
};

// Get details of a specific pool along with its members
exports.getPoolDetails = async (req, res) => {
  const poolId = req.params.id;

  try {
    const [poolResult] = await db.query(
      `SELECT * FROM pools WHERE pool_id = ? AND active = 1`,
      [poolId]
    );

    if (poolResult.length === 0) {
      return res.status(404).json({ message: "Pool not found" });
    }

    const [membersResult] = await db.query(
      `SELECT u.user_id, u.user_name, pm.role, pm.contribution
       FROM pool_members pm
       JOIN users u ON pm.user_id = u.user_id
       WHERE pm.pool_id = ?`,
      [poolId]
    );

    res.status(200).json({ pool: poolResult[0], members: membersResult });
  } catch (err) {
    console.error("Error fetching pool details:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch pool details", error: err });
  }
};

// Add member to a pool using their email
exports.addMemberToPool = async (req, res) => {
  const poolId = req.params.id;
  const { email, role } = req.body;

  if (!email || !role) {
    return res.status(400).json({ message: "Email and role are required" });
  }

  try {
    const [userResult] = await db.query(
      "SELECT user_id FROM users WHERE email = ?",
      [email]
    );

    if (userResult.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userId = userResult[0].user_id;

    const [checkResults] = await db.query(
      `SELECT 
      (SELECT COUNT(*) FROM pools WHERE pool_id = ? AND active = 1) AS poolExists,
      (SELECT COUNT(*) FROM pool_members WHERE pool_id = ? AND user_id = ?) AS memberExists`,
      [poolId, poolId, userId]
    );

    const { poolExists, memberExists } = checkResults[0];

    if (!poolExists) {
      return res.status(404).json({ message: "Pool not found or inactive" });
    }

    if (memberExists) {
      return res
        .status(400)
        .json({ message: "User is already a member of the pool" });
    }

    await db.query(
      "INSERT INTO pool_members (pool_id, user_id, role) VALUES (?, ?, ?)",
      [poolId, userId, role]
    );

    res.status(201).json({ message: "Member added successfully" });
  } catch (err) {
    console.error("Error adding member to pool:", err);
    res.status(500).json({ message: "Failed to add member", error: err });
  }
};

// Soft-delete a pool
exports.deletePool = async (req, res) => {
  const poolId = req.params.id;
  const userId = req.user.user_id;

  try {
    const [result] = await db.query(
      `SELECT role FROM pool_members WHERE pool_id = ? AND user_id = ?`,
      [poolId, userId]
    );

    if (result.length === 0 || result[0].role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only pool admins can delete the pool" });
    }

    await db.query("UPDATE pools SET active = 0 WHERE pool_id = ?", [poolId]);

    res.status(200).json({ message: "Pool deleted successfully" });
  } catch (err) {
    console.error("Error deleting pool:", err);
    res.status(500).json({ message: "Failed to delete pool", error: err });
  }
};

// Update pool details - name and description
exports.updatePoolDetails = async (req, res) => {
  const poolId = req.params.id;
  const { pool_name, description } = req.body;

  try {
    await db.query(
      "UPDATE pools SET pool_name = ?, description = ? WHERE pool_id = ?",
      [pool_name, description, poolId]
    );
    res.status(200).json({ message: "Pool updated successfully" });
  } catch (err) {
    console.error("Error updating pool:", err);
    res.status(500).json({ message: "Failed to update pool", error: err });
  }
};

// Remove a member from a pool
exports.removeMemberFromPool = async (req, res) => {
  const poolId = req.params.id;
  const { user_id } = req.body;

  try {
    const [result] = await db.query(
      "SELECT role FROM pool_members WHERE pool_id = ? AND user_id = ?",
      [poolId, user_id]
    );

    if (result.length === 0) {
      return res.status(404).json({ message: "Member not found in this pool" });
    }

    const memberRole = result[0].role;

    if (memberRole === "admin") {
      const [newAdminResult] = await db.query(
        "SELECT user_id FROM pool_members WHERE pool_id = ? AND user_id != ? LIMIT 1",
        [poolId, user_id]
      );

      if (newAdminResult.length === 0) {
        return res.status(400).json({
          message:
            "Cannot remove admin, no other members to transfer admin role",
        });
      }

      const newAdminId = newAdminResult[0].user_id;
      await db.query(
        "UPDATE pool_members SET role = 'admin' WHERE pool_id = ? AND user_id = ?",
        [poolId, newAdminId]
      );
    }

    await db.query(
      "DELETE FROM pool_members WHERE pool_id = ? AND user_id = ?",
      [poolId, user_id]
    );

    res.status(200).json({ message: "Member removed successfully" });
  } catch (err) {
    console.error("Error removing member:", err);
    res.status(500).json({ message: "Failed to remove member", error: err });
  }
};

// Change the role of a member in a pool
exports.changeMemberRole = async (req, res) => {
  const poolId = req.params.id;
  const { target_user_id, new_role } = req.body;
  const requestingUserId = req.user.user_id;

  if (!target_user_id || !new_role) {
    return res
      .status(400)
      .json({ message: "User ID and new role are required" });
  }

  try {
    const [result] = await db.query(
      `SELECT role FROM pool_members WHERE pool_id = ? AND user_id = ?`,
      [poolId, requestingUserId]
    );

    if (result.length === 0 || result[0].role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only pool admins can change member roles" });
    }

    const [memberResult] = await db.query(
      `SELECT role FROM pool_members WHERE pool_id = ? AND user_id = ?`,
      [poolId, target_user_id]
    );

    if (memberResult.length === 0) {
      return res
        .status(404)
        .json({ message: "Target user is not a member of the pool" });
    }

    await db.query(
      `UPDATE pool_members SET role = ? WHERE pool_id = ? AND user_id = ?`,
      [new_role, poolId, target_user_id]
    );

    res.status(200).json({
      message: `Member role updated to ${new_role} successfully`,
    });
  } catch (err) {
    console.error("Error changing member role:", err);
    res
      .status(500)
      .json({ message: "Failed to update member role", error: err });
  }
};
