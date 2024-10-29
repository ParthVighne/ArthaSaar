const db = require("../config/db");

// Create a new transaction and update balances
exports.createTransaction = async (req, res) => {
  const {
    from_user_id,
    to_user_id,
    from_pool_id,
    to_pool_id,
    amount,
    description,
    transaction_type,
  } = req.body;

  if (!amount || !transaction_type) {
    return res
      .status(400)
      .json({ message: "Amount and transaction type are required" });
  }

  // Verify that there is at least one sender and one receiver
  const hasSender = from_user_id || from_pool_id;
  const hasReceiver = to_user_id || to_pool_id;
  if (!hasSender || !hasReceiver) {
    return res
      .status(400)
      .json({ message: "Transaction must have a sender and a receiver" });
  }

  // Ensure the transaction_type matches the correct conditions
  const validTransactionTypes = [
    "person_to_person",
    "person_to_pool",
    "pool_to_person",
    "pool_to_pool",
    "contribution",
  ];

  if (!validTransactionTypes.includes(transaction_type)) {
    return res.status(400).json({ message: "Invalid transaction type" });
  }

  const connection = await db.getConnection();

  try {
    // Begin transaction
    await connection.beginTransaction();

    // Insert into transactions table
    const [result] = await connection.query(
      `INSERT INTO transactions (from_user_id, to_user_id, from_pool_id, to_pool_id, amount, description, transaction_type)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        from_user_id,
        to_user_id,
        from_pool_id,
        to_pool_id,
        amount,
        description,
        transaction_type,
      ]
    );

    const transactionId = result.insertId;

    // Update balances based on the transaction
    if (from_user_id) {
      await connection.query(
        `UPDATE users SET balance = balance - ? WHERE user_id = ?`,
        [amount, from_user_id]
      );
    }

    if (from_pool_id) {
      await connection.query(
        `UPDATE pools SET pool_balance = pool_balance - ? WHERE pool_id = ?`,
        [amount, from_pool_id]
      );
    }

    if (to_user_id) {
      await connection.query(
        `UPDATE users SET balance = balance + ? WHERE user_id = ?`,
        [amount, to_user_id]
      );
    }

    if (to_pool_id) {
      await connection.query(
        `UPDATE pools SET pool_balance = pool_balance + ? WHERE pool_id = ?`,
        [amount, to_pool_id]
      );
    }

    // Commit transaction
    await connection.commit();

    res.status(201).json({
      message: "Transaction created and balances updated successfully",
      transactionId,
    });
  } catch (err) {
    // Rollback transaction in case of error
    await connection.rollback();
    console.error("Error processing transaction:", err);
    res
      .status(500)
      .json({ message: "Failed to process transaction", error: err });
  } finally {
    // Release the connection back to the pool
    connection.release();
  }
};

// Get transaction history for a specific user
exports.getUserTransactionHistory = async (req, res) => {
  const userId = req.params.id;

  try {
    const [results] = await db.query(
      `SELECT * FROM transactions 
       WHERE from_user_id = ? OR to_user_id = ? 
       ORDER BY created_at DESC`,
      [userId, userId]
    );

    res.status(200).json({ transactions: results });
  } catch (err) {
    console.error("Error fetching user transaction history:", err);
    res.status(500).json({
      message: "Failed to retrieve transaction history",
      error: err,
    });
  }
};

// Get transaction history for a specific pool
exports.getPoolTransactionHistory = async (req, res) => {
  const poolId = req.params.id;

  try {
    const [results] = await db.query(
      `SELECT * FROM transactions 
       WHERE from_pool_id = ? OR to_pool_id = ? 
       ORDER BY created_at DESC`,
      [poolId, poolId]
    );

    res.status(200).json({ transactions: results });
  } catch (err) {
    console.error("Error fetching pool transaction history:", err);
    res.status(500).json({
      message: "Failed to retrieve pool transaction history",
      error: err,
    });
  }
};
