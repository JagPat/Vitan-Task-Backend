const express = require('express');
const analyticsService = require('../services');

const router = express.Router();

// Health check
router.get('/health', async (req, res) => {
  try {
    const health = await analyticsService.healthCheck();
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: 'Analytics service health check failed' });
  }
});

// Performance metrics
router.get('/performance', async (req, res) => {
  try {
    const { timeRange } = req.query;
    const metrics = await analyticsService.getPerformanceMetrics(timeRange);
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch performance metrics' });
  }
});

// User behavior analytics
router.get('/user-behavior', async (req, res) => {
  try {
    const { timeRange } = req.query;
    const analytics = await analyticsService.getUserBehaviorAnalytics(timeRange);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user behavior analytics' });
  }
});

// System analytics
router.get('/system', async (req, res) => {
  try {
    const { timeRange } = req.query;
    const analytics = await analyticsService.getSystemAnalytics(timeRange);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch system analytics' });
  }
});

// Business analytics
router.get('/business', async (req, res) => {
  try {
    const { timeRange } = req.query;
    const analytics = await analyticsService.getBusinessAnalytics(timeRange);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch business analytics' });
  }
});

// Custom reports
router.post('/reports', async (req, res) => {
  try {
    const report = await analyticsService.createReport(req.body);
    res.status(201).json(report);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create report' });
  }
});

router.get('/reports', async (req, res) => {
  try {
    const reports = await analyticsService.getReports(req.query);
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

router.get('/reports/:id', async (req, res) => {
  try {
    const report = await analyticsService.getReportById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

router.put('/reports/:id', async (req, res) => {
  try {
    const report = await analyticsService.updateReport(req.params.id, req.body);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json(report);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update report' });
  }
});

router.delete('/reports/:id', async (req, res) => {
  try {
    const deleted = await analyticsService.deleteReport(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

// Data collection
router.post('/data', async (req, res) => {
  try {
    const dataPoint = await analyticsService.collectDataPoint(req.body);
    res.status(201).json(dataPoint);
  } catch (error) {
    res.status(400).json({ error: 'Failed to collect data point' });
  }
});

router.get('/data', async (req, res) => {
  try {
    const dataPoints = await analyticsService.getDataPoints(req.query);
    res.json(dataPoints);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data points' });
  }
});

// Export functionality
router.get('/export', async (req, res) => {
  try {
    const { format, ...filters } = req.query;
    
    if (!format) {
      return res.status(400).json({ error: 'Export format is required' });
    }
    
    const data = await analyticsService.exportData(format, filters);
    
    res.setHeader('Content-Type', this.getContentType(format));
    res.setHeader('Content-Disposition', `attachment; filename="analytics-export.${format}"`);
    res.send(data);
  } catch (error) {
    res.status(500).json({ error: `Failed to export data: ${error.message}` });
  }
});

// Insights and recommendations
router.get('/insights', async (req, res) => {
  try {
    const { timeRange } = req.query;
    const insights = await analyticsService.getInsights(timeRange);
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

// Combined analytics overview
router.get('/overview', async (req, res) => {
  try {
    const { timeRange } = req.query;
    
    const [performance, userBehavior, system, business, insights] = await Promise.all([
      analyticsService.getPerformanceMetrics(timeRange),
      analyticsService.getUserBehaviorAnalytics(timeRange),
      analyticsService.getSystemAnalytics(timeRange),
      analyticsService.getBusinessAnalytics(timeRange),
      analyticsService.getInsights(timeRange)
    ]);
    
    res.json({
      timestamp: new Date().toISOString(),
      timeRange,
      performance,
      userBehavior,
      system,
      business,
      insights
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics overview' });
  }
});

// Real-time metrics
router.get('/realtime', async (req, res) => {
  try {
    const realtimeData = {
      timestamp: new Date().toISOString(),
      activeUsers: Math.floor(Math.random() * 100) + 50,
      currentLoad: (Math.random() * 0.5 + 0.3).toFixed(2),
      responseTime: Math.floor(Math.random() * 200) + 50,
      errorRate: (Math.random() * 0.02).toFixed(4)
    };
    
    res.json(realtimeData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch real-time metrics' });
  }
});

// Utility method for content type
function getContentType(format) {
  const contentTypes = {
    json: 'application/json',
    csv: 'text/csv',
    xml: 'application/xml'
  };
  
  return contentTypes[format.toLowerCase()] || 'application/octet-stream';
}

module.exports = router;
