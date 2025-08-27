const express = require('express');

module.exports = {
  name: 'onboarding',
  version: '1.0.0',
  description: 'User onboarding helpers',
  async initialize(serviceContainer, app) {
    const logger = serviceContainer.get('logger');
    const router = express.Router();

    router.get('/health', (_req, res) => res.json({ success: true, module: 'onboarding', status: 'healthy' }));
    router.get('/steps', (_req, res) => res.json({ success: true, steps: ['welcome', 'language', 'role'] }));

    app.use('/api/modules/onboarding', router);
    logger.info('Onboarding module routes registered at /api/modules/onboarding');
    return true;
  },
  health: async () => ({ status: 'healthy', module: 'onboarding' }),
  shutdown: async () => true,
};

