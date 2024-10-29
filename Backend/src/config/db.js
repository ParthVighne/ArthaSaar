const mysql = require("mysql2/promise");
require("dotenv").config();

// Create a connection pool to the database
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 15, // Adjust as needed
  queueLimit: 0,
});

// Test the database connection
(async () => {
  try {
    const connection = await db.getConnection();
    console.log("Connected to MySQL database");
    connection.release(); // Release connection back to the pool
  } catch (err) {
    console.error("Error connecting to the database:", err);
    process.exit(1); // Exit process with failure
  }
})();

module.exports = db;
