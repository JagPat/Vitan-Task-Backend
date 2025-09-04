module.exports = {
  name: 'system',
  version: '2.0.0',
  description: 'System management and monitoring',
  async initialize(serviceContainer, app) {
    const logger = serviceContainer.get('logger');
    const router = require('./routes/systemManagement');
    app.use('/api/modules/system', router);
    logger.info('System module routes registered at /api/modules/system');
    return true;
  },
  health: async () => ({ status: 'healthy', module: 'system', timestamp: new Date().toISOString() }),
  shutdown: async () => true,
};
