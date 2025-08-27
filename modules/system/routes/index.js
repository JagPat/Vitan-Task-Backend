const express = require('express');
const systemService = require('../services');

const router = express.Router();

// Health check
router.get('/health', async (req, res) => {
  try {
    const health = await systemService.healthCheck();
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: 'System service health check failed' });
  }
});

// System status overview
router.get('/status', async (req, res) => {
  try {
    const status = await systemService.getSystemStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get system status' });
  }
});

// Module management
router.get('/modules', async (req, res) => {
  try {
    const modules = await systemService.getAllModules();
    res.json(modules);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch modules' });
  }
});

router.get('/modules/:name', async (req, res) => {
  try {
    const module = await systemService.getModuleStatus(req.params.name);
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }
    res.json(module);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch module status' });
  }
});

router.post('/modules/:name', async (req, res) => {
  try {
    const module = await systemService.registerModule(req.params.name, req.body.status);
    res.status(201).json(module);
  } catch (error) {
    res.status(400).json({ error: 'Failed to register module' });
  }
});

router.put('/modules/:name', async (req, res) => {
  try {
    const module = await systemService.updateModuleStatus(req.params.name, req.body.status);
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }
    res.json(module);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update module status' });
  }
});

// Performance metrics
router.get('/metrics/performance', async (req, res) => {
  try {
    const metrics = await systemService.getPerformanceMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch performance metrics' });
  }
});

// Event logging
router.get('/events', async (req, res) => {
  try {
    const events = await systemService.getEvents(req.query);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

router.post('/events', async (req, res) => {
  try {
    const { type, message, data } = req.body;
    if (!type || !message) {
      return res.status(400).json({ error: 'Type and message are required' });
    }
    
    const event = await systemService.logEvent(type, message, data);
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ error: 'Failed to log event' });
  }
});

// System diagnostics
router.get('/diagnostics', async (req, res) => {
  try {
    const diagnostics = await systemService.runDiagnostics();
    res.json(diagnostics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to run diagnostics' });
  }
});

// Configuration management
router.get('/configuration', async (req, res) => {
  try {
    const config = await systemService.getConfiguration();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
});

// Metrics tracking endpoints
router.post('/metrics/requests', async (req, res) => {
  try {
    await systemService.incrementRequests();
    res.json({ message: 'Request metric incremented' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to increment request metric' });
  }
});

router.post('/metrics/errors', async (req, res) => {
  try {
    await systemService.incrementErrors();
    res.json({ message: 'Error metric incremented' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to increment error metric' });
  }
});

module.exports = router;
