const express = require('express');
const templateService = require('../services');

const router = express.Router();

// Health check
router.get('/health', async (req, res) => {
  try {
    const health = await templateService.healthCheck();
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: 'Template service health check failed' });
  }
});

// Task Template CRUD operations
router.post('/tasks', async (req, res) => {
  try {
    const template = await templateService.createTaskTemplate(req.body);
    res.status(201).json(template);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create task template' });
  }
});

router.get('/tasks', async (req, res) => {
  try {
    const templates = await templateService.getTaskTemplates(req.query);
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch task templates' });
  }
});

router.get('/tasks/:id', async (req, res) => {
  try {
    const template = await templateService.getTaskTemplateById(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Task template not found' });
    }
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch task template' });
  }
});

router.put('/tasks/:id', async (req, res) => {
  try {
    const template = await templateService.updateTaskTemplate(req.params.id, req.body);
    if (!template) {
      return res.status(404).json({ error: 'Task template not found' });
    }
    res.json(template);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update task template' });
  }
});

router.delete('/tasks/:id', async (req, res) => {
  try {
    const deleted = await templateService.deleteTaskTemplate(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Task template not found' });
    }
    res.json({ message: 'Task template deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task template' });
  }
});

// Project Template CRUD operations
router.post('/projects', async (req, res) => {
  try {
    const template = await templateService.createProjectTemplate(req.body);
    res.status(201).json(template);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create project template' });
  }
});

router.get('/projects', async (req, res) => {
  try {
    const templates = await templateService.getProjectTemplates(req.query);
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project templates' });
  }
});

router.get('/projects/:id', async (req, res) => {
  try {
    const template = await templateService.getProjectTemplateById(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Project template not found' });
    }
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project template' });
  }
});

router.put('/projects/:id', async (req, res) => {
  try {
    const template = await templateService.updateProjectTemplate(req.params.id, req.body);
    if (!template) {
      return res.status(404).json({ error: 'Project template not found' });
    }
    res.json(template);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update project template' });
  }
});

router.delete('/projects/:id', async (req, res) => {
  try {
    const deleted = await templateService.deleteProjectTemplate(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Project template not found' });
    }
    res.json({ message: 'Project template deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project template' });
  }
});

// Template cloning
router.post('/tasks/:id/clone', async (req, res) => {
  try {
    const cloned = await templateService.cloneTaskTemplate(req.params.id, req.body);
    if (!cloned) {
      return res.status(404).json({ error: 'Task template not found' });
    }
    res.status(201).json(cloned);
  } catch (error) {
    res.status(400).json({ error: 'Failed to clone task template' });
  }
});

router.post('/projects/:id/clone', async (req, res) => {
  try {
    const cloned = await templateService.cloneProjectTemplate(req.params.id, req.body);
    if (!cloned) {
      return res.status(404).json({ error: 'Project template not found' });
    }
    res.status(201).json(cloned);
  } catch (error) {
    res.status(400).json({ error: 'Failed to clone project template' });
  }
});

// Template usage tracking
router.post('/:id/usage', async (req, res) => {
  try {
    const usage = await templateService.trackTemplateUsage(req.params.id, req.body);
    res.status(201).json(usage);
  } catch (error) {
    res.status(400).json({ error: 'Failed to track template usage' });
  }
});

// Template statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await templateService.getTemplateStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch template statistics' });
  }
});

// Template search
router.get('/search', async (req, res) => {
  try {
    const { q: query, type } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const results = await templateService.searchTemplates(query, type);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search templates' });
  }
});

// Get all templates (both types)
router.get('/', async (req, res) => {
  try {
    const [taskTemplates, projectTemplates] = await Promise.all([
      templateService.getTaskTemplates(),
      templateService.getProjectTemplates()
    ]);
    
    res.json({
      taskTemplates,
      projectTemplates,
      total: taskTemplates.length + projectTemplates.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

module.exports = router;
