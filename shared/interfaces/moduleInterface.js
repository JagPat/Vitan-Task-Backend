/**
 * Module Interface - Standard interface for all modules
 * 
 * This defines the contract that all modules must implement
 * to work with the modular architecture.
 */

class ModuleInterface {
  constructor(name, version, description = '') {
    this.name = name;
    this.version = version;
    this.description = description;
    this.status = 'registered';
    this.registeredAt = new Date();
  }

  /**
   * Get module metadata
   * @returns {Object} Module metadata
   */
  getMetadata() {
    return {
      name: this.name,
      version: this.version,
      description: this.description,
      status: this.status,
      registeredAt: this.registeredAt
    };
  }

  /**
   * Initialize the module
   * @param {Object} container - Service container
   * @param {Object} app - Express app instance
   * @param {Object} options - Initialization options
   */
  async initialize(container, app, options = {}) {
    throw new Error('initialize method must be implemented by module');
  }

  /**
   * Start the module
   * @param {Object} container - Service container
   */
  async start(container) {
    this.status = 'started';
    this.startedAt = new Date();
  }

  /**
   * Stop the module
   * @param {Object} container - Service container
   */
  async stop(container) {
    this.status = 'stopped';
    this.stoppedAt = new Date();
  }

  /**
   * Health check for the module
   * @returns {Object} Health status
   */
  async health() {
    return {
      status: this.status,
      name: this.name,
      version: this.version,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get module dependencies
   * @returns {Array} Array of dependency names
   */
  getDependencies() {
    return [];
  }

  /**
   * Get module capabilities
   * @returns {Array} Array of capability names
   */
  getCapabilities() {
    return [];
  }

  /**
   * Validate module configuration
   * @param {Object} config - Configuration object
   * @returns {boolean} True if valid
   */
  validateConfig(config) {
    return true;
  }

  /**
   * Get module routes
   * @returns {Object|null} Express router or null
   */
  getRoutes() {
    return null;
  }

  /**
   * Get module middleware
   * @returns {Array} Array of middleware functions
   */
  getMiddleware() {
    return [];
  }

  /**
   * Get module services
   * @returns {Object} Object containing service instances
   */
  getServices() {
    return {};
  }

  /**
   * Handle module errors
   * @param {Error} error - Error object
   */
  handleError(error) {
    this.status = 'error';
    this.error = error.message;
  }

  /**
   * Reset module state
   */
  reset() {
    this.status = 'registered';
    this.initializedAt = null;
    this.startedAt = null;
    this.stoppedAt = null;
    this.error = null;
  }
}

/**
 * Module Factory - Creates modules from definitions
 */
class ModuleFactory {
  /**
   * Create a module from a definition
   * @param {Object} moduleDefinition - Module definition object
   * @returns {Object} Module instance
   */
  static createModule(moduleDefinition) {
    const module = Object.create(ModuleInterface.prototype);
    
    // Copy all properties from definition
    Object.assign(module, moduleDefinition);
    
    // Ensure required properties exist
    if (!module.name) {
      throw new Error('Module must have a name');
    }
    
    if (!module.version) {
      throw new Error('Module must have a version');
    }
    
    if (typeof module.initialize !== 'function') {
      throw new Error('Module must have an initialize method');
    }
    
    // Set default values
    module.status = 'registered';
    module.registeredAt = new Date();
    
    return module;
  }

  /**
   * Validate a module definition
   * @param {Object} moduleDefinition - Module definition object
   * @returns {boolean} True if valid
   */
  static validateModule(module) {
    const required = ['name', 'version', 'initialize'];
    const missing = required.filter(prop => !module[prop]);
    
    if (missing.length > 0) {
      throw new Error(`Module missing required properties: ${missing.join(', ')}`);
    }
    
    if (typeof module.initialize !== 'function') {
      throw new Error('Module initialize must be a function');
    }
    
    return true;
  }
}

module.exports = { ModuleInterface, ModuleFactory };
