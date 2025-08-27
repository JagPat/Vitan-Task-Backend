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
    
    // Mock users data
    const users = [
      {
        id: 'user_001',
        name: 'Jagrut Patel',
        email: 'jagrutpatel@gmail.com',
        role: 'admin',
        status: 'active',
        joinDate: '2025-01-15',
        lastLogin: '2025-08-24T14:30:00Z',
        department: 'Engineering',
        avatar: 'https://ui-avatars.com/api/?name=Jagrut+Patel&background=0D9488&color=fff'
      },
      {
        id: 'user_002',
        name: 'Sarah Chen',
        email: 'sarah.chen@whatstask.com',
        role: 'user',
        status: 'active',
        joinDate: '2025-02-01',
        lastLogin: '2025-08-24T13:45:00Z',
        department: 'Engineering',
        avatar: 'https://ui-avatars.com/api/?name=Sarah+Chen&background=7C3AED&color=fff'
      }
    ];

    // GET /api/modules/users
    router.get('/', (req, res) => {
      try {
        logger.info('Users requested', { 
          count: users.length,
          userAgent: req.get('User-Agent')
        });
        
        res.json({
          success: true,
          data: users,
          count: users.length,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Error fetching users:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch users',
          timestamp: new Date().toISOString()
        });
      }
    });

    // GET /api/modules/users/stats
    router.get('/stats', (req, res) => {
      try {
        const stats = {
          totalUsers: users.length,
          activeUsers: users.filter(user => user.status === 'active').length,
          byRole: {
            admin: users.filter(user => user.role === 'admin').length,
            user: users.filter(user => user.role === 'user').length,
            viewer: 0
          }
        };

        logger.info('User stats requested', { stats });
        
        res.json({
          success: true,
          data: stats,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Error fetching user stats:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch user statistics',
          timestamp: new Date().toISOString()
        });
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
