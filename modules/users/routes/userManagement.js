const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
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
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: "Admin access required"
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: "Invalid token"
    });
  }
};

/**
 * GET /api/modules/users
 * Get all users (admin only)
 */
router.get("/", requireAdmin, async (req, res) => {
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    const query = `
      SELECT id, email, name, picture, role, status, login_method as "loginMethod", 
             last_login as "lastLogin", created_at as "createdAt", updated_at as "updatedAt"
      FROM users 
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query);
    await pool.end();

    res.json({
      success: true,
      data: {
        users: result.rows,
        total: result.rows.length
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch users"
    });
  }
});

/**
 * GET /api/modules/users/:id
 * Get specific user by ID (admin only)
 */
router.get("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    const query = `
      SELECT id, email, name, picture, role, status, login_method as "loginMethod", 
             last_login as "lastLogin", created_at as "createdAt", updated_at as "updatedAt"
      FROM users 
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    await pool.end();

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    res.json({
      success: true,
      data: {
        user: result.rows[0]
      }
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user"
    });
  }
});

/**
 * PUT /api/modules/users/:id/role
 * Update user role (admin only)
 */
router.put("/:id/role", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, reason } = req.body;
    const adminUserId = req.user.userId;

    // Validate role
    const validRoles = ['user', 'admin', 'moderator'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: "Invalid role. Must be one of: user, admin, moderator"
      });
    }

    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    // Start transaction
    await pool.query('BEGIN');

    try {
      // Get current user role
      const currentUserQuery = `
        SELECT role FROM users WHERE id = $1
      `;
      const currentUserResult = await pool.query(currentUserQuery, [id]);
      
      if (currentUserResult.rows.length === 0) {
        await pool.query('ROLLBACK');
        await pool.end();
        return res.status(404).json({
          success: false,
          error: "User not found"
        });
      }

      const oldRole = currentUserResult.rows[0].role;

      // Update user role
      const updateQuery = `
        UPDATE users 
        SET role = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, email, name, picture, role, status, login_method as "loginMethod", 
                  last_login as "lastLogin", created_at as "createdAt", updated_at as "updatedAt"
      `;
      
      const updateResult = await pool.query(updateQuery, [id, role]);

      // Log role change in audit log
      const auditQuery = `
        INSERT INTO role_audit_log (user_id, old_role, new_role, changed_by, reason)
        VALUES ($1, $2, $3, $4, $5)
      `;
      
      await pool.query(auditQuery, [id, oldRole, role, adminUserId, reason || 'Role updated by admin']);

      // Commit transaction
      await pool.query('COMMIT');

      res.json({
        success: true,
        message: "User role updated successfully",
        data: {
          user: updateResult.rows[0]
        }
      });

    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    } finally {
      await pool.end();
    }

  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      error: "Failed to update user role"
    });
  }
});

/**
 * PUT /api/modules/users/:id/status
 * Update user status (admin only)
 */
router.put("/:id/status", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const adminUserId = req.user.userId;

    // Validate status
    const validStatuses = ['active', 'inactive', 'suspended'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status. Must be one of: active, inactive, suspended"
      });
    }

    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    // Start transaction
    await pool.query('BEGIN');

    try {
      // Get current user status
      const currentUserQuery = `
        SELECT status FROM users WHERE id = $1
      `;
      const currentUserResult = await pool.query(currentUserQuery, [id]);
      
      if (currentUserResult.rows.length === 0) {
        await pool.query('ROLLBACK');
        await pool.end();
        return res.status(404).json({
          success: false,
          error: "User not found"
        });
      }

      const oldStatus = currentUserResult.rows[0].status;

      // Update user status
      const updateQuery = `
        UPDATE users 
        SET status = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, email, name, picture, role, status, login_method as "loginMethod", 
                  last_login as "lastLogin", created_at as "createdAt", updated_at as "updatedAt"
      `;
      
      const updateResult = await pool.query(updateQuery, [id, status]);

      // Log status change in audit log
      const auditQuery = `
        INSERT INTO role_audit_log (user_id, old_role, new_role, changed_by, reason)
        VALUES ($1, $2, $3, $4, $5)
      `;
      
      await pool.query(auditQuery, [id, oldStatus, status, adminUserId, reason || 'Status updated by admin']);

      // Commit transaction
      await pool.query('COMMIT');

      res.json({
        success: true,
        message: "User status updated successfully",
        data: {
          user: updateResult.rows[0]
        }
      });

    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    } finally {
      await pool.end();
    }

  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      error: "Failed to update user status"
    });
  }
});

/**
 * GET /api/modules/users/audit-log
 * Get role change audit log (admin only)
 */
router.get("/audit-log", requireAdmin, async (req, res) => {
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    const query = `
      SELECT 
        ral.id,
        ral.user_id,
        u.email as user_email,
        u.name as user_name,
        ral.old_role,
        ral.new_role,
        ral.reason,
        ral.changed_at,
        admin_user.email as changed_by_email,
        admin_user.name as changed_by_name
      FROM role_audit_log ral
      JOIN users u ON ral.user_id = u.id
      JOIN users admin_user ON ral.changed_by = admin_user.id
      ORDER BY ral.changed_at DESC
      LIMIT 100
    `;
    
    const result = await pool.query(query);
    await pool.end();

    res.json({
      success: true,
      data: {
        auditLog: result.rows,
        total: result.rows.length
      }
    });

  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch audit log"
    });
  }
});

/**
 * GET /api/modules/users/permissions/:email
 * Get user permissions (admin only)
 */
router.get("/permissions/:email", requireAdmin, async (req, res) => {
  try {
    const { email } = req.params;
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    const query = `
      SELECT 
        p.name as permission_name,
        p.description,
        p.category
      FROM users u
      JOIN role_permissions rp ON u.role = rp.role
      JOIN permissions p ON rp.permission_id = p.id
      WHERE u.email = $1 AND u.status = 'active'
      ORDER BY p.category, p.name
    `;
    
    const result = await pool.query(query, [email]);
    await pool.end();

    res.json({
      success: true,
      data: {
        permissions: result.rows,
        total: result.rows.length
      }
    });

  } catch (error) {
    console.error('Error fetching user permissions:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user permissions"
    });
  }
});

module.exports = router;
