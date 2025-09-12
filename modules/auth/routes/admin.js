const express = require("express");
const adminAuth = require("../middleware/adminAuth");
const { Pool } = require('pg');

const router = express.Router();

// Protect all admin routes
router.use(adminAuth);

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
router.get("/stats", async (_req, res) => {
  try {
    const counts = await getCountsFromDatabase();
    res.json({
      success: true,
      message: "Admin statistics retrieved",
      data: {
        totalUsers: counts.totalUsers,
        totalTasks: counts.totalTasks,
        totalProjects: counts.totalProjects,
        systemHealth: "healthy",
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    // Graceful fallback when DB isn't available
    res.json({
      success: true,
      message: "Admin statistics retrieved (fallback)",
      data: {
        totalUsers: 0,
        totalTasks: 0,
        totalProjects: 0,
        systemHealth: "degraded",
        lastUpdated: new Date().toISOString()
      }
    });
  }
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

async function getCountsFromDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL not configured');

  const ssl = process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false;
  const pool = new Pool({ connectionString, ssl });
  try {
    // Count users
    const usersRes = await pool.query('SELECT COUNT(*)::int AS c FROM users');
    // Count tasks
    const tasksRes = await pool.query('SELECT COUNT(*)::int AS c FROM tasks WHERE deleted_at IS NULL');
    // Derive projects from tasks distinct project_id (ignores null)
    const projRes = await pool.query('SELECT COUNT(DISTINCT project_id)::int AS c FROM tasks WHERE project_id IS NOT NULL AND deleted_at IS NULL');
    return {
      totalUsers: usersRes.rows[0]?.c || 0,
      totalTasks: tasksRes.rows[0]?.c || 0,
      totalProjects: projRes.rows[0]?.c || 0
    };
  } finally {
    await pool.end();
  }
}
