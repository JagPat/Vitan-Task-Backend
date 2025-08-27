const express = require('express');

// Import AI controllers
const aiController = require('./ai.controller');
const aiAnalyticsController = require('./aiAnalytics.controller');
const userMemoryController = require('./userMemory.controller');

module.exports = {
  name: 'ai',
  version: '3.0.0',
  description: 'AI Learning System with conversations, analytics, user memory, and prompt optimization',
  dependencies: ['logger'],
  routes: [
    // Core AI endpoints
    { method: 'POST', path: '/analyze', handler: 'analyzeMessage' },
    { method: 'POST', path: '/whatsapp/process', handler: 'processWhatsAppMessage' },
    { method: 'GET', path: '/prompts/variants/:intent/:language', handler: 'getPromptVariants' },
    { method: 'POST', path: '/prompts/test-result', handler: 'logTestResult' },
    
    // Analytics endpoints
    { method: 'GET', path: '/analytics/summary', handler: 'getAnalyticsSummary' },
    { method: 'GET', path: '/analytics/intent-stats', handler: 'getIntentStats' },
    { method: 'GET', path: '/analytics/corrections', handler: 'getCorrections' },
    { method: 'GET', path: '/analytics/checklists', handler: 'getChecklistInsights' },
    { method: 'GET', path: '/analytics/experiments', handler: 'getExperiments' },
    { method: 'GET', path: '/analytics/real-time', handler: 'getRealTimeMetrics' },
    { method: 'GET', path: '/analytics/productivity', handler: 'getProductivityInsights' },
    
    // Learning and memory endpoints
    { method: 'GET', path: '/learning/user-context/:phoneNumber', handler: 'getUserContext' },
    { method: 'PUT', path: '/learning/user-context/:phoneNumber', handler: 'updateUserContext' },
    { method: 'POST', path: '/learning/log-interaction', handler: 'logInteraction' },
    { method: 'POST', path: '/learning/log-correction', handler: 'logCorrection' },
    { method: 'GET', path: '/learning/patterns/:phoneNumber', handler: 'getLearningPatterns' },
    
    // Health checks
    { method: 'GET', path: '/health', handler: 'healthCheck' },
    { method: 'GET', path: '/analytics/health', handler: 'analyticsHealthCheck' },
    { method: 'GET', path: '/learning/health', handler: 'learningHealthCheck' }
  ],

  initialize(serviceContainer, app) {
    const router = express.Router();
    const logger = serviceContainer.get('logger');
    
    // Mount AI controllers
    router.use('/', aiController);
    router.use('/analytics', aiAnalyticsController);
    router.use('/learning', userMemoryController);
    
    // Register routes on both legacy and modular paths
    app.use('/api/ai', router);
    app.use('/api/modules/ai', router);
    logger.info('AI Learning System routes registered at /api/ai and /api/modules/ai');
    
    // Log all available endpoints
    this.logAvailableEndpoints();
  },

  logAvailableEndpoints() {
    const endpoints = [
      // Core AI
      'POST /api/ai/analyze',
      'POST /api/ai/whatsapp/process',
      'GET /api/ai/prompts/variants/:intent/:language',
      'POST /api/ai/prompts/test-result',
      
      // Analytics
      'GET /api/ai/analytics/summary',
      'GET /api/ai/analytics/intent-stats',
      'GET /api/ai/analytics/corrections',
      'GET /api/ai/analytics/checklists',
      'GET /api/ai/analytics/experiments',
      'GET /api/ai/analytics/real-time',
      'GET /api/ai/analytics/productivity',
      
      // Learning
      'GET /api/ai/learning/user-context/:phoneNumber',
      'PUT /api/ai/learning/user-context/:phoneNumber',
      'POST /api/ai/learning/log-interaction',
      'POST /api/ai/learning/log-correction',
      'GET /api/ai/learning/patterns/:phoneNumber',
      
      // Health
      'GET /api/ai/health',
      'GET /api/ai/analytics/health',
      'GET /api/ai/learning/health'
    ];
    
    logger.info('AI Learning System endpoints:', { endpoints });
  },

  health() {
    return {
      status: 'healthy',
      module: 'ai-learning-system',
      version: '3.0.0',
      timestamp: new Date().toISOString(),
      features: [
        'Message Analysis',
        'WhatsApp Integration',
        'Prompt Optimization',
        'Analytics Dashboard',
        'User Memory System',
        'Learning Patterns',
        'A/B Testing'
      ],
      endpoints: [
        'POST /api/ai/analyze',
        'POST /api/ai/whatsapp/process',
        'GET /api/ai/analytics/summary',
        'GET /api/ai/learning/user-context/:phoneNumber'
      ]
    };
  },

  shutdown() {
    logger.info('AI Learning System module shutdown');
  }
};
