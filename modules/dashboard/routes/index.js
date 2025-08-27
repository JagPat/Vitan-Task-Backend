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
    const overview = await dashboardService.getDashboardOverview();
    res.json(overview.quickStats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quick stats' });
  }
});

module.exports = router;
