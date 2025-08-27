// Use central logger from service container
const TaskService = require('./services/taskService');
const routes = require('./routes');

module.exports = {
  name: 'tasks',
  version: '1.0.0',
  description: 'Tasks management module',

  async initialize(serviceContainer, app) {
    const logger = serviceContainer.get('logger');

    try {
      const database = serviceContainer.get('database');
      const eventBus = serviceContainer.get('eventBus');

      const taskService = new TaskService(database, eventBus);
      app.locals.taskService = taskService;
      logger.info('TaskService registered in app.locals');

      // Register legacy and modular mounts for backward compatibility
      app.use('/api/tasks', routes);
      app.use('/api/modules/tasks', routes);
      this.routes = ['/api/tasks', '/api/modules/tasks'];
      logger.info('Tasks module routes registered at /api/tasks and /api/modules/tasks');

      return true;
    } catch (error) {
      logger.error('Failed to initialize Tasks module', { error: error.message });
      throw error;
    }
  },

  async shutdown() {
    // Nothing to cleanup yet
    return true;
  },

  async health() {
    return {
      status: 'healthy',
      module: 'tasks',
      timestamp: new Date().toISOString()
    };
  }
};
