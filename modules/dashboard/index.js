module.exports = {
  name: 'dashboard',
  version: '2.0.0',
  description: 'Dashboard metrics and overview',
  async initialize(serviceContainer, app) {
    const logger = serviceContainer.get('logger');
    const router = require('./routes');
    app.use('/api/modules/dashboard', router);
    logger.info('Dashboard module routes registered at /api/modules/dashboard');
    return true;
  },
  health: async () => ({ status: 'healthy', module: 'dashboard', timestamp: new Date().toISOString() }),
  shutdown: async () => true,
};
