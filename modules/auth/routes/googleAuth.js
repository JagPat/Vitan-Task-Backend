const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * POST /api/modules/auth/google/login
 * Google OAuth login with dynamic role assignment
 */
router.post("/login", async (req, res) => {
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

    // Try to load/create user from DB. If DB fails, fall back to ephemeral user.
    let user = null;
    try {
      user = await getUserFromDatabase(email);
      if (!user) {
        user = await createNewUser({
          email,
          name,
          picture,
          googleId,
          role: 'user'
        });
        req.logger?.info("New user created via Google OAuth", {
          email: user.email,
          role: user.role,
          loginMethod: user.loginMethod
        });
      } else {
        await updateUserLastLogin(user.id, picture);
        user.picture = picture;
      }
    } catch (dbError) {
      req.logger?.warn("Auth DB unavailable, proceeding with ephemeral user", { error: dbError.message });
      // Minimal user object to allow login to proceed
      user = {
        id: `ephemeral_${googleId}`,
        email,
        name,
        picture,
        role: 'user',
        status: 'active',
        loginMethod: 'google'
      };
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: "Account is not active. Please contact support."
      });
    }

    // Generate JWT token with user's role from database
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        loginMethod: user.loginMethod
      },
      process.env.JWT_SECRET || process.env.AUTH_JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Log successful login
    req.logger?.info("User logged in via Google OAuth", {
      email: user.email,
      role: user.role,
      loginMethod: user.loginMethod
    });

    // Respond with token and user info
    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          picture: user.picture,
          role: user.role,
          status: user.status
        }
      }
    });

  } catch (error) {
    req.logger?.error("Google OAuth login failed:", { message: error.message });

    // Invalid token / verification issues
    if (
      error.message.includes("Invalid Value") ||
      error.message.includes("invalid") ||
      error.message.includes("expired") ||
      error.code === 'ERR_JWT_INVALID'
    ) {
      return res.status(401).json({ success: false, error: "Invalid Google token" });
    }

    // Everything else → treat as service error
    return res.status(500).json({ success: false, error: "Google OAuth authentication failed" });
  }
});

/**
 * GET /api/modules/auth/google/verify
 * Verify Google OAuth token and return user info
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
    
    // Get fresh user data from database
    const user = await getUserFromDatabase(decoded.email);
    
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: "User not found or inactive"
      });
    }

    // Return updated user info
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          picture: user.picture,
          role: user.role,
          status: user.status
        }
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

/**
 * POST /api/modules/auth/google/refresh
 * Refresh user's role and permissions from database
 */
router.post("/refresh", async (req, res) => {
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
    
    // Get fresh user data from database
    const user = await getUserFromDatabase(decoded.email);
    
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: "User not found or inactive"
      });
    }

    // Generate new token with updated role
    const newToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        loginMethod: user.loginMethod
      },
      process.env.JWT_SECRET || process.env.AUTH_JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        token: newToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          picture: user.picture,
          role: user.role,
          status: user.status
        }
      }
    });

  } catch (error) {
    req.logger?.error("Token refresh failed:", error);
    res.status(401).json({
      success: false,
      error: "Token refresh failed"
    });
  }
});

// Database helper functions
async function getUserFromDatabase(email) {
  try {
    // This should be replaced with your actual database query
    // For now, using a placeholder - you'll need to implement this
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    const query = `
      SELECT id, email, name, picture, role, status, login_method as "loginMethod", 
             last_login as "lastLogin", created_at as "createdAt", updated_at as "updatedAt"
      FROM users 
      WHERE email = $1
    `;
    
    const result = await pool.query(query, [email]);
    await pool.end();
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Database error:', error);
    return null;
  }
}

async function createNewUser(userData) {
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    const query = `
      INSERT INTO users (email, name, picture, google_id, role, status, login_method)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, name, picture, role, status, login_method as "loginMethod", 
                last_login as "lastLogin", created_at as "createdAt", updated_at as "updatedAt"
    `;
    
    const values = [
      userData.email,
      userData.name,
      userData.picture,
      userData.googleId,
      userData.role,
      'active',
      'google'
    ];
    
    const result = await pool.query(query, values);
    await pool.end();
    
    return result.rows[0];
  } catch (error) {
    console.error('Database error creating user:', error);
    throw error;
  }
}

async function updateUserLastLogin(userId, picture) {
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    const query = `
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP, picture = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    
    await pool.query(query, [userId, picture]);
    await pool.end();
  } catch (error) {
    console.error('Database error updating last login:', error);
  }
}

module.exports = router;
