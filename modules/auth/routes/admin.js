const express = require("express");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

console.log('🔍 DEBUG: Admin routes file loaded');

// Protect all admin routes
router.use(adminAuth);

// Test route to verify admin router is working
router.get('/test', (req, res) => {
  console.log('🔍 DEBUG: Admin test route hit');
  res.json({ success: true, message: 'Admin test route working', user: req.user });
});

/**
 * GET /api/modules/auth/admin/profile
 * Get admin profile information
 */
router.get("/profile", (req, res) => {
  res.json({
    success: true,
    message: "Admin profile retrieved",
    data: {
      user: req.user,
      permissions: ["read", "write", "delete", "admin"],
      lastLogin: new Date().toISOString()
    }
  });
});

/**
 * GET /api/modules/auth/admin/stats
 * Get admin dashboard statistics
 */
router.get("/stats", (req, res) => {
  res.json({
    success: true,
    message: "Admin statistics retrieved",
    data: {
      totalUsers: 0, // TODO: Implement actual stats
      totalTasks: 0,
      totalProjects: 0,
      systemHealth: "healthy",
      lastUpdated: new Date().toISOString()
    }
  });
});

/**
 * GET /api/modules/auth/admin/dashboard
 * Admin dashboard endpoint (protected)
 */
router.get("/dashboard", (req, res) => {
  res.json({
    success: true,
    message: "Admin dashboard accessed",
    data: {
      user: req.user,
      dashboard: {
        title: "WhatsTask Admin Dashboard",
        version: "2.0.0",
        lastUpdated: new Date().toISOString(),
        features: ["user-management", "system-stats", "admin-controls"]
      }
    }
  });
});

/**
 * POST /api/modules/auth/admin/logout
 * Admin logout (invalidate token on frontend)
 */
router.post("/logout", (req, res) => {
  res.json({
    success: true,
    message: "Admin logged out successfully"
  });
});

module.exports = router;
