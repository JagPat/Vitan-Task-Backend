const winston = require('winston');

/**
 * Service Container for Dependency Injection
 * Manages service instances and their dependencies in a modular architecture
 */
class ServiceContainer {
  constructor() {
    this.services = new Map();
    this.modules = new Map();
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'service-container.log' })
      ]
    });
  }

  /**
   * Register a service instance
   * @param {string} serviceName - Name of the service
   * @param {any} serviceInstance - Service instance
   * @param {Object} options - Registration options
   */
  register(serviceName, serviceInstance, options = {}) {
    if (this.services.has(serviceName)) {
      this.logger.warn(`Service '${serviceName}' already registered, overwriting`);
    }
    
    this.services.set(serviceName, {
      instance: serviceInstance,
      options,
      registeredAt: new Date(),
      dependencies: options.dependencies || []
    });
    
    this.logger.info(`Service '${serviceName}' registered successfully`);
  }

  /**
   * Get a service instance
   * @param {string} serviceName - Name of the service
   * @returns {any} Service instance
   */
  get(serviceName) {
    if (!this.services.has(serviceName)) {
      throw new Error(`Service '${serviceName}' not found. Available services: ${Array.from(this.services.keys()).join(', ')}`);
    }
    return this.services.get(serviceName).instance;
  }

  /**
   * Check if a service exists
   * @param {string} serviceName - Name of the service
   * @returns {boolean} True if service exists
   */
  has(serviceName) {
    return this.services.has(serviceName);
  }

  /**
   * Get all registered service names
   * @returns {string[]} Array of service names
   */
  getServiceNames() {
    return Array.from(this.services.keys());
  }

  /**
   * Register a module
   * @param {string} moduleName - Name of the module
   * @param {Object} moduleDefinition - Module definition
   */
  registerModule(moduleName, moduleDefinition) {
    this.modules.set(moduleName, {
      ...moduleDefinition,
      registeredAt: new Date(),
      status: 'registered'
    });
    
    this.logger.info(`Module '${moduleName}' registered successfully`);
  }

  /**
   * Get module information
   * @param {string} moduleName - Name of the module
   * @returns {Object} Module information
   */
  getModule(moduleName) {
    return this.modules.get(moduleName);
  }

  /**
   * Get all registered modules
   * @returns {Object} Map of modules
   */
  getModules() {
    return this.modules;
  }

  /**
   * Initialize all registered modules
   * @param {Object} app - Express app instance
   */
  async initializeModules(app) {
    this.logger.info('Initializing all registered modules...');
    
    for (const [moduleName, moduleInfo] of this.modules) {
      try {
        if (moduleInfo.initialize && typeof moduleInfo.initialize === 'function') {
          this.logger.info(`Initializing module: ${moduleName}`);
          await moduleInfo.initialize(this, app);
          moduleInfo.status = 'initialized';
          this.logger.info(`Module '${moduleName}' initialized successfully`);
        }
      } catch (error) {
        this.logger.error(`Failed to initialize module '${moduleName}':`, error);
        moduleInfo.status = 'error';
        moduleInfo.error = error.message;
      }
    }
    
    this.logger.info('Module initialization completed');
  }

  /**
   * Health check for all services
   * @returns {Object} Health status
   */
  async healthCheck() {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {},
      modules: {}
    };

    // Check services
    for (const [serviceName, serviceInfo] of this.services) {
      try {
        if (serviceInfo.instance.healthCheck && typeof serviceInfo.instance.healthCheck === 'function') {
          health.services[serviceName] = await serviceInfo.instance.healthCheck();
        } else {
          health.services[serviceName] = { status: 'unknown', timestamp: serviceInfo.registeredAt };
        }
      } catch (error) {
        health.services[serviceName] = { status: 'error', error: error.message };
        health.status = 'degraded';
      }
    }

    // Check modules
    for (const [moduleName, moduleInfo] of this.modules) {
      try {
        if (moduleInfo.health && typeof moduleInfo.health === 'function') {
          health.modules[moduleName] = await moduleInfo.health();
        } else {
          health.modules[moduleName] = { status: moduleInfo.status, timestamp: moduleInfo.registeredAt };
        }
      } catch (error) {
        health.modules[moduleName] = { status: 'error', error: error.message };
        health.status = 'degraded';
      }
    }

    return health;
  }

  /**
   * Gracefully shutdown all services
   */
  async shutdown() {
    this.logger.info('Shutting down service container...');
    
    for (const [serviceName, serviceInfo] of this.services) {
      try {
        if (serviceInfo.instance.shutdown && typeof serviceInfo.instance.shutdown === 'function') {
          await serviceInfo.instance.shutdown();
          this.logger.info(`Service '${serviceName}' shut down successfully`);
        }
      } catch (error) {
        this.logger.error(`Error shutting down service '${serviceName}':`, error);
      }
    }
    
    this.logger.info('Service container shutdown completed');
  }
}

module.exports = ServiceContainer;
