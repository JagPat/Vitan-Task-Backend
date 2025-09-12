const express = require('express');

module.exports = {
  name: 'onboarding',
  version: '1.0.0',
  description: 'User onboarding helpers',
  async initialize(serviceContainer, app) {
    const logger = serviceContainer.get('logger');
    const router = express.Router();
    const { Pool } = require('pg');
    const mem = new Map(); // in-memory fallback

    router.get('/health', (_req, res) => res.json({ success: true, module: 'onboarding', status: 'healthy' }));
    router.get('/steps', (_req, res) => res.json({ success: true, steps: ['welcome', 'language', 'use-case'] }));

    // Save onboarding preferences
    router.post('/preferences', async (req, res) => {
      try {
        const { email, preferred_language = 'en', use_case, answers = {} } = req.body || {};
        if (!email) return res.status(400).json({ success: false, error: 'email is required' });

        // Try DB first
        try {
          const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });
          await pool.query(
            `UPDATE users SET preferred_language=$2, onboarding_data=$3, updated_at=NOW() WHERE email=$1;
             INSERT INTO users (email, name, role, status, preferred_language, onboarding_data)
             SELECT $1, $1, 'user', 'active', $2, $3
             WHERE NOT EXISTS (SELECT 1 FROM users WHERE email=$1);`,
            [email.toLowerCase(), preferred_language, JSON.stringify(answers)]
          );
          await pool.end();
        } catch (dbErr) {
          // Fallback to memory
          mem.set(email.toLowerCase(), { preferred_language, answers });
        }

        res.json({ success: true });
      } catch (error) {
        logger.error('Onboarding save failed:', error);
        res.status(500).json({ success: false, error: 'Failed to save onboarding preferences' });
      }
    });

    // Get onboarding preferences
    router.get('/preferences', async (req, res) => {
      try {
        const email = String(req.query.email || '').toLowerCase();
        if (!email) return res.status(400).json({ success: false, error: 'email is required' });

        // Try DB
        try {
          const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });
          const result = await pool.query('SELECT preferred_language, onboarding_data FROM users WHERE email=$1', [email]);
          await pool.end();
          if (result.rows[0]) {
            return res.json({ success: true, data: { preferred_language: result.rows[0].preferred_language, answers: result.rows[0].onboarding_data || {} } });
          }
        } catch (_) {}

        // Fallback
        if (mem.has(email)) {
          const v = mem.get(email);
          return res.json({ success: true, data: v });
        }
        res.json({ success: true, data: null });
      } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to load onboarding preferences' });
      }
    });

    app.use('/api/modules/onboarding', router);
    logger.info('Onboarding module routes registered at /api/modules/onboarding');
    return true;
  },
  health: async () => ({ status: 'healthy', module: 'onboarding' }),
  shutdown: async () => true,
};
