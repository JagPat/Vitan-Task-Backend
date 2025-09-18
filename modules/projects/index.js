const express = require('express');
const logger = require('winston');

module.exports = {
  name: 'projects',
  dependencies: ['logger'],
  version: '2.0.0',
  description: 'Project management module with CRUD operations',
  routes: [
    {
      method: 'GET',
      path: '/',
      handler: 'getProjects'
    },
    {
      method: 'GET',
      path: '/stats/overview',
      handler: 'getProjectStats'
    },
    {
      method: 'POST',
      path: '/',
      handler: 'createProject'
    },
    {
      method: 'GET',
      path: '/:id',
      handler: 'getProjectById'
    },
    {
      method: 'PUT',
      path: '/:id',
      handler: 'updateProject'
    },
    {
      method: 'DELETE',
      path: '/:id',
      handler: 'deleteProject'
    }
  ],

  initialize(serviceContainer, app) {
    const router = express.Router();
    
    // Mock projects data
    const projects = [
      {
        id: 'proj_001',
        name: 'WhatsTask Platform Development',
        description: 'Building the complete task management and WhatsApp integration platform',
        status: 'active',
        progress: 85,
        startDate: '2025-08-01',
        endDate: '2025-09-30',
        team: ['user_001', 'user_002'],
        tasks: ['task_001', 'task_002', 'task_003'],
        priority: 'high',
        budget: 50000,
        client: 'Internal',
        tags: ['development', 'platform', 'whatsapp']
      },
      {
        id: 'proj_002',
        name: 'Mobile App Redesign',
        description: 'Redesigning the mobile application for better user experience',
        status: 'planning',
        progress: 25,
        startDate: '2025-09-01',
        endDate: '2025-11-30',
        team: ['user_003', 'user_004'],
        tasks: ['task_004', 'task_005'],
        priority: 'medium',
        budget: 30000,
        client: 'External Client A',
        tags: ['mobile', 'design', 'ux']
      },
      {
        id: 'proj_003',
        name: 'Database Migration',
        description: 'Migrating from legacy database to modern PostgreSQL',
        status: 'completed',
        progress: 100,
        startDate: '2025-07-01',
        endDate: '2025-08-15',
        team: ['user_001', 'user_005'],
        tasks: ['task_006', 'task_007'],
        priority: 'high',
        budget: 15000,
        client: 'Internal',
        tags: ['database', 'migration', 'postgresql']
      }
    ];

    // GET /api/modules/projects - Get all projects (optional filter by assignedEmail)
    router.get('/', (req, res) => {
      try {
        const { assignedEmail } = req.query || {};
        const list = assignedEmail
          ? projects.filter(p => Array.isArray(p.team) && p.team.includes(assignedEmail))
          : projects;
        logger.info('Projects requested', { 
          count: list.length,
          userAgent: req.get('User-Agent')
        });
        
        res.json({
          success: true,
          data: list,
          meta: {
            total: list.length,
            page: 1,
            limit: 50
          }
        });
      } catch (error) {
        logger.error('Error fetching projects:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch projects'
        });
      }
    });

    // GET /api/modules/projects/stats/overview - Get project statistics
    router.get('/stats/overview', (req, res) => {
      try {
        const stats = {
          total: projects.length,
          active: projects.filter(p => p.status === 'active').length,
          completed: projects.filter(p => p.status === 'completed').length,
          planning: projects.filter(p => p.status === 'planning').length,
          totalBudget: projects.reduce((sum, p) => sum + p.budget, 0),
          averageProgress: Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length),
          priorityBreakdown: {
            high: projects.filter(p => p.priority === 'high').length,
            medium: projects.filter(p => p.priority === 'medium').length,
            low: projects.filter(p => p.priority === 'low').length
          },
          statusBreakdown: {
            active: projects.filter(p => p.status === 'active').length,
            completed: projects.filter(p => p.status === 'completed').length,
            planning: projects.filter(p => p.status === 'planning').length,
            onHold: projects.filter(p => p.status === 'on-hold').length
          }
        };

        logger.info('Project stats requested', { stats });
        
        res.json({
          success: true,
          data: stats
        });
      } catch (error) {
        logger.error('Error fetching project stats:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch project statistics'
        });
      }
    });

    // GET /api/modules/projects/:id - Get project by ID
    router.get('/:id', (req, res) => {
      try {
        const project = projects.find(p => p.id === req.params.id);
        
        if (!project) {
          return res.status(404).json({
            success: false,
            error: 'Project not found'
          });
        }

        logger.info('Project requested by ID', { projectId: req.params.id });
        
        res.json({
          success: true,
          data: project
        });
      } catch (error) {
        logger.error('Error fetching project by ID:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch project'
        });
      }
    });

    // POST /api/modules/projects - Create new project
    router.post('/', (req, res) => {
      try {
        const { name, description, status, startDate, endDate, team, priority, budget, client, tags } = req.body;
        
        if (!name || !description) {
          return res.status(400).json({
            success: false,
            error: 'Name and description are required'
          });
        }

        const newProject = {
          id: `proj_${Date.now()}`,
          name,
          description,
          status: status || 'planning',
          progress: 0,
          startDate: startDate || new Date().toISOString().split('T')[0],
          endDate,
          team: team || [],
          tasks: [],
          priority: priority || 'medium',
          budget: budget || 0,
          client: client || 'Internal',
          tags: tags || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        projects.push(newProject);

        logger.info('New project created', { projectId: newProject.id, name: newProject.name });
        
        res.status(201).json({
          success: true,
          data: newProject,
          message: 'Project created successfully'
        });
      } catch (error) {
        logger.error('Error creating project:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to create project'
        });
      }
    });

    // PUT /api/modules/projects/:id - Update project
    router.put('/:id', (req, res) => {
      try {
        const projectIndex = projects.findIndex(p => p.id === req.params.id);
        
        if (projectIndex === -1) {
          return res.status(404).json({
            success: false,
            error: 'Project not found'
          });
        }

        const updatedProject = {
          ...projects[projectIndex],
          ...req.body,
          updatedAt: new Date().toISOString()
        };

        projects[projectIndex] = updatedProject;

        logger.info('Project updated', { projectId: req.params.id });
        
        res.json({
          success: true,
          data: updatedProject,
          message: 'Project updated successfully'
        });
      } catch (error) {
        logger.error('Error updating project:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to update project'
        });
      }
    });

    // --- Team management endpoints ---
    // GET /api/modules/projects/:id/users - List team members
    router.get('/:id/users', (req, res) => {
      try {
        const project = projects.find(p => p.id === req.params.id);
        if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
        const team = Array.isArray(project.team) ? project.team : [];
        const roles = project.teamRoles || {};
        const members = team.map(email => ({ email, role: roles[email] || 'member' }));
        res.json({ success: true, data: members });
      } catch (error) {
        logger.error('Error listing team members:', error);
        res.status(500).json({ success: false, error: 'Failed to list team' });
      }
    });

    // POST /api/modules/projects/:id/users - Add team member { email, role }
    router.post('/:id/users', (req, res) => {
      try {
        const { email, role } = req.body || {};
        if (!email) return res.status(400).json({ success: false, error: 'email required' });
        const project = projects.find(p => p.id === req.params.id);
        if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
        project.team = Array.isArray(project.team) ? project.team : [];
        if (!project.team.includes(email)) {
          project.team.push(email);
        }
        project.teamRoles = project.teamRoles || {};
        if (role) project.teamRoles[email] = role;
        project.updatedAt = new Date().toISOString();
        res.status(201).json({ success: true, data: { email, role: project.teamRoles[email] || 'member' } });
      } catch (error) {
        logger.error('Error adding team member:', error);
        res.status(500).json({ success: false, error: 'Failed to add user to project' });
      }
    });

    // PUT /api/modules/projects/:id/users - Update member role { email, role }
    router.put('/:id/users', (req, res) => {
      try {
        const { email, role } = req.body || {};
        if (!email || !role) return res.status(400).json({ success: false, error: 'email and role required' });
        const project = projects.find(p => p.id === req.params.id);
        if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
        project.team = Array.isArray(project.team) ? project.team : [];
        if (!project.team.includes(email)) return res.status(404).json({ success: false, error: 'User not in project' });
        project.teamRoles = project.teamRoles || {};
        project.teamRoles[email] = role;
        project.updatedAt = new Date().toISOString();
        res.json({ success: true, data: { email, role } });
      } catch (error) {
        logger.error('Error updating team member role:', error);
        res.status(500).json({ success: false, error: 'Failed to update user role' });
      }
    });

    // DELETE /api/modules/projects/:id/users/:email - Remove team member
    router.delete('/:id/users/:email', (req, res) => {
      try {
        const { email } = req.params;
        const project = projects.find(p => p.id === req.params.id);
        if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
        project.team = Array.isArray(project.team) ? project.team : [];
        const idx = project.team.indexOf(email);
        if (idx === -1) return res.status(404).json({ success: false, error: 'User not in project' });
        project.team.splice(idx, 1);
        if (project.teamRoles && project.teamRoles[email]) delete project.teamRoles[email];
        project.updatedAt = new Date().toISOString();
        res.json({ success: true, data: { email }, message: 'User removed' });
      } catch (error) {
        logger.error('Error removing team member:', error);
        res.status(500).json({ success: false, error: 'Failed to remove user' });
      }
    });

    // DELETE /api/modules/projects/:id - Delete project
    router.delete('/:id', (req, res) => {
      try {
        const projectIndex = projects.findIndex(p => p.id === req.params.id);
        
        if (projectIndex === -1) {
          return res.status(404).json({
            success: false,
            error: 'Project not found'
          });
        }

        const deletedProject = projects.splice(projectIndex, 1)[0];

        logger.info('Project deleted', { projectId: req.params.id, name: deletedProject.name });
        
        res.json({
          success: true,
          data: deletedProject,
          message: 'Project deleted successfully'
        });
      } catch (error) {
        logger.error('Error deleting project:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to delete project'
        });
      }
    });

    // Health check endpoint
    router.get('/health', (req, res) => {
      res.json({
        success: true,
        data: {
          module: 'projects',
          version: '2.0.0',
          status: 'healthy',
          endpoints: [
            'GET / - List all projects',
            'GET /stats/overview - Project statistics',
            'GET /:id - Get project by ID',
            'POST / - Create new project',
            'PUT /:id - Update project',
            'DELETE /:id - Delete project'
          ],
          totalProjects: projects.length
        }
      });
    });

    // Register routes
    app.use('/api/modules/projects', router);
    
    logger.info('Projects module routes registered at /api/modules/projects');
  },

  health() {
    return {
      module: 'projects',
      status: 'healthy',
      version: '2.0.0',
      endpoints: 6
    };
  },

  shutdown() {
    logger.info('Projects module shutting down');
  }
};
