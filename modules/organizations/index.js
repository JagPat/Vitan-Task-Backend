module.exports = {
  name: 'organizations',
  version: '1.0.0',
  description: 'Organization management for super admins',
  async initialize(serviceContainer, app) {
    const logger = serviceContainer.get('logger');
    const router = require('./routes/organizationManagement');
    app.use('/api/modules/organizations', router);
    logger.info('Organizations module routes registered at /api/modules/organizations');
    return true;
  },
  health: async () => ({ status: 'healthy', module: 'organizations', timestamp: new Date().toISOString() }),
  shutdown: async () => true,
};



