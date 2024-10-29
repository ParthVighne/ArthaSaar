const jwt = require("jsonwebtoken");

async function verifyToken(req, res, next) {
  const token = req.cookies.token; // Get the token from the cookie

  // If no token is present
  if (!token) {
    return res
      .status(401)
      .json({ message: "Access token is missing or invalid" });
  }

  try {
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach decoded user info to request
    next();
  } catch (err) {
    console.error("Token verification error:", err);
    return res.status(403).json({ message: "Invalid token" });
  }
}

module.exports = { verifyToken };
