module.exports = {
  name: 'billing',
  version: '1.0.0',
  description: 'Billing management for super admins',
  async initialize(serviceContainer, app) {
    const logger = serviceContainer.get('logger');
    const router = require('./routes/billingManagement');
    app.use('/api/modules/billing', router);
    logger.info('Billing module routes registered at /api/modules/billing');
    return true;
  },
  health: async () => ({ status: 'healthy', module: 'billing', timestamp: new Date().toISOString() }),
  shutdown: async () => true,
};



