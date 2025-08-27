const jwt = require("jsonwebtoken");

/**
 * Admin authentication middleware
 * Protects routes that require admin role
 */
const adminAuth = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Access token required"
      });
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.AUTH_JWT_SECRET);

    // Check if user has admin role
    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Admin access required"
      });
    }

    // Add user info to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      loginMethod: decoded.loginMethod
    };

    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "Invalid or expired token"
    });
  }
};

module.exports = adminAuth;
