const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const protect = (req, res, next) => {
  try {
    // ==========================================
    // JWT SECRET
    // ==========================================

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("JWT_SECRET is not configured");

      return res.status(500).json({
        success: false,
        message: "Authentication service is not configured",
      });
    }

    // ==========================================
    // AUTHORIZATION HEADER
    // ==========================================

    const authHeader = req.headers.authorization;

    if (
      typeof authHeader !== "string" ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token",
      });
    }

    // ==========================================
    // EXTRACT TOKEN
    // ==========================================

    const token = authHeader.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token",
      });
    }

    // ==========================================
    // VERIFY TOKEN
    // ==========================================

    const decoded = jwt.verify(token, jwtSecret);

    // ==========================================
    // VALIDATE PAYLOAD
    // ==========================================

    if (
      !decoded ||
      typeof decoded !== "object" ||
      !decoded.userId
    ) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, invalid token",
      });
    }

    // ==========================================
    // VALIDATE USER ID
    // ==========================================

    if (!mongoose.Types.ObjectId.isValid(decoded.userId)) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, invalid user",
      });
    }

    // ==========================================
    // ATTACH USER TO REQUEST
    // ==========================================

    req.user = {
      userId: decoded.userId,
      _id: decoded.userId,
    };

    next();
  } catch (error) {
    // Don't expose JWT verification details
    return res.status(401).json({
      success: false,
      message: "Not authorized, token failed",
    });
  }
};

module.exports = {
  protect,
};