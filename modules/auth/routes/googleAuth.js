const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");

const router = express.Router();

console.log('🔍 DEBUG: Google OAuth routes file loaded');

// Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Test route to verify router is working
router.get('/test', (req, res) => {
  console.log('🔍 DEBUG: Google OAuth test route hit');
  res.json({ success: true, message: 'Google OAuth test route working' });
});

/**
 * POST /api/modules/auth/google
 * Google OAuth login for admin access
 */
router.post("/", async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: "Google ID token is required"
      });
    }

    // Verify Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    // Check if this is the admin email
    if (email !== "jagrutpatel@gmail.com") {
      return res.status(403).json({
        success: false,
        error: "Access denied. Only admin users can login via Google OAuth."
      });
    }

    // Create admin user object
    const adminUser = {
      id: googleId,
      email,
      name,
      picture,
      role: "admin",
      loginMethod: "google",
      lastLogin: new Date().toISOString()
    };

    // Generate JWT token with admin role
    const token = jwt.sign(
      {
        userId: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        loginMethod: adminUser.loginMethod
      },
      process.env.JWT_SECRET || process.env.AUTH_JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Log successful admin login
    req.logger?.info("Admin user logged in via Google OAuth", {
      email: adminUser.email,
      role: adminUser.role,
      loginMethod: adminUser.loginMethod
    });

    // Respond with token and user info
    res.json({
      success: true,
      message: "Admin login successful",
      data: {
        token,
        token,
        user: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          picture: adminUser.picture,
          role: adminUser.role
        }
      }
    });

  } catch (error) {
    req.logger?.error("Google OAuth login failed:", error);
    
    if (error.message.includes("Invalid Value")) {
      return res.status(401).json({
        success: false,
        error: "Invalid Google token"
      });
    }

    res.status(500).json({
      success: false,
      error: "Google OAuth authentication failed"
    });
  }
});

/**
 * GET /api/modules/auth/google/verify
 * Verify Google OAuth token (for testing)
 */
router.get("/verify", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Bearer token required"
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.AUTH_JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(400).json({
        success: false,
        error: "Admin access required"
      });
    }

    res.json({
      success: true,
      message: "Token verified",
      data: {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        loginMethod: decoded.loginMethod
      }
    });

  } catch (error) {
    req.logger?.error("Token verification failed:", error);
    res.status(401).json({
      success: false,
      error: "Invalid token"
    });
  }
});

module.exports = router;
