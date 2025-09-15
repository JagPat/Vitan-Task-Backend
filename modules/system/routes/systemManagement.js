const express = require('express');
const router = express.Router();

// Import centralized auth middleware
const { requireAuth } = require('../../../middleware/authMiddleware');

// Middleware to check if user is super_admin only
const requireSuperAdmin = requireAuth({ 
  roles: ['super_admin'],
  permissions: ['system_settings']
});

/**
 * GET /api/modules/system/status
 * Get system status (super admin only)
 */
router.get("/status", requireSuperAdmin, async (req, res) => {
  try {
    const systemStatus = {
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development'
      },
      database: {
        status: 'connected', // This would be checked against actual DB
        connectionPool: 'active'
      },
      modules: {
        total: 12, // This would be dynamic
        active: 12,
        failed: 0
      },
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: systemStatus
    });

  } catch (error) {
    console.error('Error fetching system status:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch system status"
    });
  }
});

/**
 * GET /api/modules/system/logs
 * Get system logs (super admin only)
 */
router.get("/logs", requireSuperAdmin, async (req, res) => {
  try {
    const { level = 'info', limit = 100 } = req.query;
    
    // Mock logs for now - in production this would read from log files
    const mockLogs = [
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'System health check passed',
        module: 'health'
      },
      {
        timestamp: new Date(Date.now() - 60000).toISOString(),
        level: 'warn',
        message: 'High memory usage detected',
        module: 'monitoring'
      },
      {
        timestamp: new Date(Date.now() - 120000).toISOString(),
        level: 'info',
        message: 'User authentication successful',
        module: 'auth'
      }
    ];

    res.json({
      success: true,
      data: {
        logs: mockLogs,
        total: mockLogs.length,
        level,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching system logs:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch system logs"
    });
  }
});

/**
 * POST /api/modules/system/restart
 * Restart system services (super admin only)
 */
router.post("/restart", requireSuperAdmin, async (req, res) => {
  try {
    const { service } = req.body;
    
    // Mock restart - in production this would actually restart services
    const restartResult = {
      service: service || 'all',
      status: 'restarting',
      timestamp: new Date().toISOString(),
      message: `Service ${service || 'all'} restart initiated`
    };

    res.json({
      success: true,
      data: restartResult,
      message: "Restart command sent successfully"
    });

  } catch (error) {
    console.error('Error restarting system:', error);
    res.status(500).json({
      success: false,
      error: "Failed to restart system"
    });
  }
});

/**
 * GET /api/modules/system/config
 * Get system configuration (super admin only)
 */
router.get("/config", requireSuperAdmin, async (req, res) => {
  try {
    const config = {
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 3000,
      database: {
        url: process.env.DATABASE_URL ? 'configured' : 'not configured',
        ssl: process.env.DATABASE_SSL || 'false'
      },
      auth: {
        jwtSecret: process.env.JWT_SECRET ? 'configured' : 'not configured',
        sessionTimeout: process.env.SESSION_TIMEOUT || '24h'
      },
      cors: {
        origins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['*']
      },
      features: {
        modules: process.env.ENABLED_MODULES ? process.env.ENABLED_MODULES.split(',') : ['all'],
        debug: process.env.DEBUG === 'true'
      }
    };

    res.json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('Error fetching system config:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch system configuration"
    });
  }
});

/**
 * PUT /api/modules/system/config
 * Update system configuration (super admin only)
 */
router.put("/config", requireSuperAdmin, async (req, res) => {
  try {
    const { key, value } = req.body;
    
    if (!key || value === undefined) {
      return res.status(400).json({
        success: false,
        error: "Key and value are required"
      });
    }

    // Mock config update - in production this would update actual config
    const updateResult = {
      key,
      value,
      updated: true,
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: updateResult,
      message: "Configuration updated successfully"
    });

  } catch (error) {
    console.error('Error updating system config:', error);
    res.status(500).json({
      success: false,
      error: "Failed to update system configuration"
    });
  }
});

module.exports = router;



