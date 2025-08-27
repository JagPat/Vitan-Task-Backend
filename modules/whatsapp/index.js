const express = require('express');
const logger = require('winston');

module.exports = {
  name: 'whatsapp',
  version: '2.0.0',
  description: 'WhatsApp integration module with templates and queue management',
  dependencies: ['logger'],
  routes: [
    { method: 'GET', path: '/templates', handler: 'getTemplates' },
    { method: 'GET', path: '/queue', handler: 'getQueueStatus' }
  ],

  initialize(serviceContainer, app) {
    const router = express.Router();
    
    // Mock WhatsApp templates data
    const templates = [
      {
        id: 'template_001',
        name: 'Project Update Notification',
        category: 'project_updates',
        language: 'en',
        status: 'approved',
        content: 'Hi {{name}}, your project {{project_name}} has been updated. Status: {{status}}. Check your dashboard for details.',
        variables: ['name', 'project_name', 'status'],
        usageCount: 156,
        lastUsed: '2025-08-24T10:30:00Z',
        createdAt: '2025-07-15T09:00:00Z'
      },
      {
        id: 'template_002',
        name: 'Task Assignment Alert',
        category: 'task_management',
        language: 'en',
        status: 'approved',
        content: 'Hello {{name}}, you have been assigned a new task: {{task_title}}. Due date: {{due_date}}. Priority: {{priority}}.',
        variables: ['name', 'task_title', 'due_date', 'priority'],
        usageCount: 89,
        lastUsed: '2025-08-23T16:45:00Z',
        createdAt: '2025-07-20T11:00:00Z'
      }
    ];

    // Mock WhatsApp queue data
    const queueStatus = {
      totalMessages: 1247,
      pendingMessages: 23,
      sentMessages: 1189,
      failedMessages: 35,
      queueSize: 23,
      processingRate: 45,
      averageDeliveryTime: 2.3,
      lastProcessed: '2025-08-24T10:45:00Z',
      queueHealth: 'healthy'
    };

    // GET /api/modules/whatsapp/templates - Get WhatsApp templates
    router.get('/templates', (req, res) => {
      try {
        const { category, status, language = 'en', limit = 20, offset = 0 } = req.query;
        
        let filteredTemplates = templates;
        
        if (category) {
          filteredTemplates = filteredTemplates.filter(template => template.category === category);
        }
        if (status) {
          filteredTemplates = filteredTemplates.filter(template => template.status === status);
        }
        if (language) {
          filteredTemplates = filteredTemplates.filter(template => template.language === language);
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
        logger.error('Error fetching WhatsApp templates:', error);
        res.status(500).json({
          success: false,
          apiVersion: '1.0',
          error: 'Failed to fetch WhatsApp templates',
          timestamp: new Date().toISOString()
        });
      }
    });

    // GET /api/modules/whatsapp/queue - Get WhatsApp queue status
    router.get('/queue', (req, res) => {
      try {
        res.json({
          success: true,
          apiVersion: '1.0',
          data: queueStatus,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Error fetching WhatsApp queue status:', error);
        res.status(500).json({
          success: false,
          apiVersion: '1.0',
          error: 'Failed to fetch WhatsApp queue status',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Register routes
    app.use('/api/modules/whatsapp', router);
    logger.info('WhatsApp module routes registered at /api/modules/whatsapp');
  },

  health() {
    return {
      status: 'healthy',
      module: 'whatsapp',
      timestamp: new Date().toISOString(),
      endpoints: [
        'GET /api/modules/whatsapp/templates',
        'GET /api/modules/whatsapp/queue'
      ]
    };
  },

  shutdown() {
    logger.info('WhatsApp module shutdown');
  }
};
