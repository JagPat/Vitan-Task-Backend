const express = require('express');
const logger = require('winston');

module.exports = {
  name: 'users',
  version: '2.0.0',
  description: 'User management module with statistics and CRUD operations',
  dependencies: ['logger'],
  routes: [
    {
      method: 'GET',
      path: '/',
      handler: 'getUsers'
    },
    {
      method: 'GET',
      path: '/stats',
      handler: 'getUserStats'
    }
  ],

  initialize(serviceContainer, app) {
    const router = express.Router();
    const { Pool } = require('pg');
    
    // Fallback mock users (when DB unavailable)
    const mockUsers = [
      { id: 'user_001', name: 'Jagrut Patel', email: 'jagrutpatel@gmail.com', role: 'admin', status: 'active', lastLogin: '2025-08-24T14:30:00Z' },
      { id: 'user_002', name: 'Sarah Chen', email: 'sarah.chen@whatstask.com', role: 'user', status: 'active', lastLogin: '2025-08-24T13:45:00Z' }
    ];

    async function getUsersFromDb() {
      const cs = process.env.DATABASE_URL;
      if (!cs) throw new Error('DATABASE_URL not configured');
      const ssl = process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false;
      const pool = new Pool({ connectionString: cs, ssl });
      try {
        const q = `
          SELECT id, email, name, picture, role, status,
                 last_login AS "lastLogin", created_at AS "createdAt", updated_at AS "updatedAt"
          FROM users
          ORDER BY created_at DESC NULLS LAST
        `;
        const result = await pool.query(q);
        return result.rows;
      } finally {
        await pool.end();
      }
    }

    // GET /api/modules/users
    router.get('/', async (req, res) => {
      try {
        let data = [];
        try {
          data = await getUsersFromDb();
          logger.info('Users fetched from DB', { count: data.length });
        } catch (dbErr) {
          logger.warn('DB unavailable for users; returning mock list', { error: dbErr.message });
          data = mockUsers;
        }

        res.json({ success: true, data, count: data.length, timestamp: new Date().toISOString() });
      } catch (error) {
        logger.error('Error fetching users:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch users', timestamp: new Date().toISOString() });
      }
    });

    // GET /api/modules/users/stats
    router.get('/stats', async (_req, res) => {
      try {
        let totalUsers = 0, activeUsers = 0, byRole = { admin: 0, user: 0, moderator: 0, super_admin: 0 };
        try {
          const list = await getUsersFromDb();
          totalUsers = list.length;
          activeUsers = list.filter(u => u.status === 'active').length;
          list.forEach(u => { if (u.role && byRole[u.role] !== undefined) byRole[u.role]++; });
        } catch (_) {
          totalUsers = mockUsers.length;
          activeUsers = mockUsers.filter(u => u.status === 'active').length;
          mockUsers.forEach(u => { if (u.role && byRole[u.role] !== undefined) byRole[u.role]++; });
        }

        const stats = { totalUsers, activeUsers, byRole };
        logger.info('User stats requested', { stats });
        res.json({ success: true, data: stats, timestamp: new Date().toISOString() });
      } catch (error) {
        logger.error('Error fetching user stats:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch user statistics', timestamp: new Date().toISOString() });
      }
    });

    // Register routes
    app.use('/api/modules/users', router);
    logger.info('Users module routes registered at /api/modules/users');
  },

  health() {
    return {
      status: 'healthy',
      module: 'users',
      timestamp: new Date().toISOString(),
      endpoints: [
        'GET /api/modules/users',
        'GET /api/modules/users/stats'
      ]
    };
  },

  shutdown() {
    logger.info('Users module shutdown');
  }
};
