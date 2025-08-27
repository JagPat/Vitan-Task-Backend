const express = require('express');
const logger = require('winston');

module.exports = {
  name: 'templates',
  version: '2.0.0',
  description: 'Template management module for tasks and projects',
  dependencies: ['logger'],
  routes: [
    { method: 'GET', path: '/tasks', handler: 'getTaskTemplates' },
    { method: 'GET', path: '/projects', handler: 'getProjectTemplates' }
  ],

  initialize(serviceContainer, app) {
    const router = express.Router();
    
    // Mock task templates data
    const taskTemplates = [
      {
        id: 'task_template_001',
        name: 'Bug Fix Template',
        category: 'development',
        description: 'Standard template for bug fixing tasks',
        priority: 'high',
        estimatedHours: 4,
        checklist: [
          'Reproduce the bug',
          'Identify root cause',
          'Write fix',
          'Test fix',
          'Update documentation',
          'Create PR'
        ],
        tags: ['bug', 'fix', 'development'],
        usageCount: 156,
        lastUsed: '2025-08-24T14:30:00Z',
        createdAt: '2025-06-15T09:00:00Z',
        createdBy: 'user_001'
      },
      {
        id: 'task_template_002',
        name: 'Feature Development Template',
        category: 'development',
        description: 'Template for new feature development',
        priority: 'medium',
        estimatedHours: 16,
        checklist: [
          'Requirements analysis',
          'Design review',
          'Implementation',
          'Unit testing',
          'Integration testing',
          'Code review',
          'Documentation',
          'Deployment'
        ],
        tags: ['feature', 'development', 'new'],
        usageCount: 89,
        lastUsed: '2025-08-23T16:45:00Z',
        createdAt: '2025-07-01T10:00:00Z',
        createdBy: 'user_002'
      }
    ];

    // Mock project templates data
    const projectTemplates = [
      {
        id: 'project_template_001',
        name: 'Web Application Template',
        category: 'development',
        description: 'Standard template for web application projects',
        estimatedDuration: 45,
        phases: [
          {
            name: 'Planning',
            duration: 5,
            deliverables: ['Project plan', 'Requirements doc', 'Timeline']
          },
          {
            name: 'Design',
            duration: 10,
            deliverables: ['UI/UX mockups', 'Technical architecture', 'Database design']
          },
          {
            name: 'Development',
            duration: 20,
            deliverables: ['Core features', 'API endpoints', 'Database implementation']
          },
          {
            name: 'Testing',
            duration: 7,
            deliverables: ['Unit tests', 'Integration tests', 'User acceptance tests']
          },
          {
            name: 'Deployment',
            duration: 3,
            deliverables: ['Production deployment', 'Documentation', 'Training']
          }
        ],
        teamRoles: ['Project Manager', 'Frontend Developer', 'Backend Developer', 'UI/UX Designer', 'QA Engineer'],
        tags: ['web', 'application', 'full-stack'],
        usageCount: 23,
        lastUsed: '2025-08-20T10:00:00Z',
        createdAt: '2025-05-01T08:00:00Z',
        createdBy: 'user_001'
      }
    ];

    // GET /api/modules/templates/tasks - Get task templates
    router.get('/tasks', (req, res) => {
      try {
        const { category, priority, limit = 20, offset = 0 } = req.query;
        
        let filteredTemplates = taskTemplates;
        
        if (category) {
          filteredTemplates = filteredTemplates.filter(template => template.category === category);
        }
        if (priority) {
          filteredTemplates = filteredTemplates.filter(template => template.priority === priority);
        }
        
        const paginatedTemplates = filteredTemplates.slice(offset, offset + limit);
        
        res.json({
          success: true,
          apiVersion: '1.0',
          data: paginatedTemplates,
          pagination: {
            total: filteredTemplates.length,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: offset + limit < filteredTemplates.length
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Error fetching task templates:', error);
        res.status(500).json({
          success: false,
          apiVersion: '1.0',
          error: 'Failed to fetch task templates',
          timestamp: new Date().toISOString()
        });
      }
    });

    // GET /api/modules/templates/projects - Get project templates
    router.get('/projects', (req, res) => {
      try {
        const { category, limit = 20, offset = 0 } = req.query;
        
        let filteredTemplates = projectTemplates;
        
        if (category) {
          filteredTemplates = filteredTemplates.filter(template => template.category === category);
        }
        
        const paginatedTemplates = filteredTemplates.slice(offset, offset + limit);
        
        res.json({
          success: true,
          apiVersion: '1.0',
          data: paginatedTemplates,
          pagination: {
            total: filteredTemplates.length,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: offset + limit < filteredTemplates.length
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Error fetching project templates:', error);
        res.status(500).json({
          success: false,
          apiVersion: '1.0',
          error: 'Failed to fetch project templates',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Register routes
    app.use('/api/modules/templates', router);
    logger.info('Templates module routes registered at /api/modules/templates');
  },

  health() {
    return {
      status: 'healthy',
      module: 'templates',
      timestamp: new Date().toISOString(),
      endpoints: [
        'GET /api/modules/templates/tasks',
        'GET /api/modules/templates/projects'
      ]
    };
  },

  shutdown() {
    logger.info('Templates module shutdown');
  }
};
