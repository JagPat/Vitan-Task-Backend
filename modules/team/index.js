const express = require('express');
const logger = require('winston');

module.exports = {
  name: 'team',
  version: '2.0.0',
  description: 'Team management module with CRUD operations',
  dependencies: ['logger'],
  routes: [
    {
      method: 'GET',
      path: '/',
      handler: 'getTeamMembers'
    },
    {
      method: 'GET',
      path: '/stats',
      handler: 'getTeamStats'
    }
  ],

  initialize(serviceContainer, app) {
    const router = express.Router();
    
    // Mock team data - matching frontend TeamMember interface
    const teamMembers = [
      {
        id: 'user_001',
        userId: 'user_001',
        userName: 'Jagrut Patel',
        email: 'jagrutpatel@gmail.com',
        role: 'admin',
        status: 'active',
        avatar: 'https://ui-avatars.com/api/?name=Jagrut+Patel&background=0D9488&color=fff',
        department: 'Engineering',
        position: 'Project Manager',
        joinedAt: '2025-01-15',
        lastActive: '2025-08-24',
        permissions: ['read', 'write', 'admin']
      },
      {
        id: 'user_002',
        userId: 'user_002',
        userName: 'Sarah Chen',
        email: 'sarah.chen@whatstask.com',
        role: 'member',
        status: 'active',
        avatar: 'https://ui-avatars.com/api/?name=Sarah+Chen&background=7C3AED&color=fff',
        department: 'Engineering',
        position: 'Senior Developer',
        joinedAt: '2025-02-01',
        lastActive: '2025-08-24',
        permissions: ['read', 'write']
      }
    ];

    // GET /api/modules/team - Get all team members
    router.get('/', (req, res) => {
      try {
        logger.info('Team members requested', { 
          count: teamMembers.length,
          userAgent: req.get('User-Agent')
        });
        
        res.json({
          success: true,
          data: teamMembers,
          count: teamMembers.length,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Error fetching team members:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch team members',
          timestamp: new Date().toISOString()
        });
      }
    });

    // GET /api/modules/team/stats - Get team statistics
    router.get('/stats', (req, res) => {
      try {
        const stats = {
          totalMembers: teamMembers.length,
          activeMembers: teamMembers.filter(member => member.status === 'active').length,
          departments: [...new Set(teamMembers.map(member => member.department))],
          averageRating: 4.8,
          totalCompletedTasks: 83,
          totalTasks: 90,
          completionRate: 92.2,
          
          // Frontend expected stats
          active: teamMembers.filter(member => member.status === 'active').length,
          byRole: {
            admin: teamMembers.filter(member => member.role === 'admin').length,
            member: teamMembers.filter(member => member.role === 'member').length,
            viewer: 0
          },
          pending: 0
        };

        logger.info('Team stats requested', { stats });
        
        res.json({
          success: true,
          data: stats,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Error fetching team stats:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch team statistics',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Register routes
    app.use('/api/modules/team', router);
    logger.info('Team module routes registered at /api/modules/team');
  },

  health() {
    return {
      status: 'healthy',
      module: 'team',
      timestamp: new Date().toISOString(),
      endpoints: [
        'GET /api/modules/team',
        'GET /api/modules/team/stats'
      ]
    };
  },

  shutdown() {
    logger.info('Team module shutdown');
  }
};
