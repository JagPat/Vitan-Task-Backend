const express = require('express');
const dashboardService = require('../services');

const router = express.Router();

// Health check
router.get('/health', async (req, res) => {
  try {
    const health = await dashboardService.healthCheck();
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: 'Dashboard service health check failed' });
  }
});

// Dashboard overview
router.get('/overview', async (req, res) => {
  try {
    const overview = await dashboardService.getDashboardOverview();
    res.json(overview);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard overview' });
  }
});

// Key metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await dashboardService.getKeyMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch key metrics' });
  }
});

// Recent activity
router.get('/activity', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const activity = await dashboardService.getRecentActivity(limit);
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

// Log activity
router.post('/activity', async (req, res) => {
  try {
    const { type, description, userId, metadata } = req.body;
    
    if (!type || !description || !userId) {
      return res.status(400).json({ 
        error: 'Type, description, and userId are required' 
      });
    }
    
    const activity = await dashboardService.logActivity(type, description, userId, metadata);
    res.status(201).json(activity);
  } catch (error) {
    res.status(400).json({ error: 'Failed to log activity' });
  }
});

// Chart data
router.get('/charts/:chartType', async (req, res) => {
  try {
    const { chartType } = req.params;
    const filters = req.query;
    
    const chartData = await dashboardService.getChartData(chartType, filters);
    
    if (chartData.error) {
      return res.status(400).json(chartData);
    }
    
    res.json(chartData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
});

// Performance insights
router.get('/insights', async (req, res) => {
  try {
    const insights = await dashboardService.getPerformanceInsights();
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch performance insights' });
  }
});

// Update metrics (for other services)
router.post('/metrics/:metricType', async (req, res) => {
  try {
    const { metricType } = req.params;
    const data = req.body;
    
    await dashboardService.updateMetrics(metricType, data);
    res.json({ message: 'Metrics updated successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Failed to update metrics' });
  }
});

// Dashboard summary (combines multiple endpoints)
router.get('/summary', async (req, res) => {
  try {
    const [overview, metrics, insights] = await Promise.all([
      dashboardService.getDashboardOverview(),
      dashboardService.getKeyMetrics(),
      dashboardService.getPerformanceInsights()
    ]);
    
    res.json({
      overview,
      metrics,
      insights,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
});

// Quick stats
router.get('/quick-stats', async (req, res) => {
  try {
    // Prefer live DB metrics when available
    const dbConn = (() => {
      try { return require('../../core/database/connection'); } catch (_) { return null; }
    })();

    if (dbConn && typeof dbConn.query === 'function' && dbConn.pool) {
      try {
        const [totalTasks, completedTasks, activeProjects, activeUsers] = await Promise.all([
          dbConn.query("SELECT COUNT(*)::int AS c FROM tasks WHERE deleted_at IS NULL"),
          dbConn.query("SELECT COUNT(*)::int AS c FROM tasks WHERE deleted_at IS NULL AND LOWER(status)='completed'"),
          dbConn.query("SELECT COUNT(DISTINCT project_id)::int AS c FROM tasks WHERE deleted_at IS NULL AND project_id IS NOT NULL"),
          dbConn.query("SELECT COUNT(*)::int AS c FROM users WHERE status='active'")
        ]);

        const t = totalTasks.rows[0]?.c || 0;
        const c = completedTasks.rows[0]?.c || 0;
        const completionRate = t ? Math.round((c / t) * 100) : 0;
        const quick = {
          completionRate,
          activeProjects: activeProjects.rows[0]?.c || 0,
          teamCollaboration: activeUsers.rows[0]?.c || 0
        };
        return res.json(quick);
      } catch (e) {
        // fall through to in-memory overview
      }
    }

    // Fallback to in-memory overview quick stats
    const overview = await dashboardService.getDashboardOverview();
    res.json(overview.quickStats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quick stats' });
  }
});

module.exports = router;
