const express = require('express');
const logger = require('winston');

module.exports = {
  name: 'contacts',
  version: '1.0.0',
  description: 'Contacts management module',

  initialize: async (serviceContainer, app) => {
    const router = express.Router();

    // Minimal routes
    router.get('/health', (req, res) => {
      res.json({ success: true, data: { status: 'healthy', module: 'contacts', version: '1.0.0' } });
    });

    router.get('/', (req, res) => {
      res.json({ success: true, data: [], message: 'Contacts list (empty placeholder)' });
    });

    // Mount on both legacy and modular paths
    app.use('/api/contacts', router);
    app.use('/api/modules/contacts', router);
    logger.info('Contacts module routes registered at /api/contacts and /api/modules/contacts');
    return true;
  },

  shutdown: async () => {
    logger.info('Contacts module shutdown');
    return true;
  },

  healthCheck: async () => ({ status: 'healthy', module: 'contacts', timestamp: new Date().toISOString() })
};
