const fs = require('fs').promises;
const path = require('path');
const winston = require('winston');

/**
 * Module Loader
 * Automatically discovers and loads modules from the modules directory
 */
class ModuleLoader {
  constructor(modulesPath = './modules') {
    this.modulesPath = modulesPath;
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'module-loader.log' })
      ]
    });
    
    this.loadedModules = new Map();
    this.moduleErrors = new Map();
  }

  /**
   * Discover all available modules
   * @returns {Promise<Array>} Array of module paths
   */
  async discoverModules() {
    try {
      const modules = [];
      const moduleDirs = await fs.readdir(this.modulesPath);
      
      for (const dir of moduleDirs) {
        const modulePath = path.join(this.modulesPath, dir);
        const stat = await fs.stat(modulePath);
        
        if (stat.isDirectory()) {
          const indexPath = path.resolve(modulePath, 'index.js');
          
          try {
            await fs.access(indexPath);
            modules.push({
              name: dir,
              path: modulePath,
              indexPath: indexPath
            });
          } catch (error) {
            this.logger.debug(`Module ${dir} has no index.js file`);
          }
        }
      }
      
      this.logger.info(`Discovered ${modules.length} modules:`, modules.map(m => m.name));
      return modules;
    } catch (error) {
      this.logger.error('Failed to discover modules:', error);
      return [];
    }
  }

  /**
   * Load a single module
   * @param {Object} moduleInfo - Module information
   * @returns {Promise<Object>} Loaded module
   */
  async loadModule(moduleInfo) {
    try {
      this.logger.info(`Loading module: ${moduleInfo.name}`);
      
      // Load module definition (use absolute path to avoid Node resolving as a package)
      const resolvedIndexPath = path.resolve(moduleInfo.indexPath);
      const moduleDefinition = require(resolvedIndexPath);
      
      // Validate module structure
      if (!this.validateModuleDefinition(moduleDefinition, moduleInfo.name)) {
        throw new Error(`Invalid module definition for ${moduleInfo.name}`);
      }
      
      // Create module instance
      const module = {
        ...moduleDefinition,
        name: moduleInfo.name,
        path: moduleInfo.path,
        loadedAt: new Date()
      };
      
      this.loadedModules.set(moduleInfo.name, module);
      this.logger.info(`Module ${moduleInfo.name} loaded successfully`);
      
      return module;
    } catch (error) {
      this.logger.error(`Failed to load module ${moduleInfo.name}:`, error);
      this.moduleErrors.set(moduleInfo.name, error.message);
      throw error;
    }
  }

  /**
   * Load all discovered modules
   * @returns {Promise<Map>} Map of loaded modules
   */
  async loadAllModules() {
    try {
      const discoveredModules = await this.discoverModules();
      const loadPromises = discoveredModules.map(moduleInfo => 
        this.loadModule(moduleInfo).catch(error => {
          this.logger.error(`Failed to load module ${moduleInfo.name}:`, error);
          return null;
        })
      );
      
      const results = await Promise.allSettled(loadPromises);
      const successfulModules = results
        .filter(result => result.status === 'fulfilled' && result.value !== null)
        .map(result => result.value);
      
      this.logger.info(`Successfully loaded ${successfulModules.length}/${discoveredModules.length} modules`);
      
      return this.loadedModules;
    } catch (error) {
      this.logger.error('Failed to load modules:', error);
      throw error;
    }
  }

  /**
   * Validate module definition
   * @param {Object} moduleDefinition - Module definition object
   * @param {string} moduleName - Module name for error reporting
   * @returns {boolean} True if valid
   */
  validateModuleDefinition(moduleDefinition, moduleName) {
    const required = ['name', 'version', 'initialize'];
    const missing = required.filter(prop => !moduleDefinition[prop]);
    
    if (missing.length > 0) {
      this.logger.error(`Module ${moduleName} missing required properties: ${missing.join(', ')}`);
      return false;
    }
    
    if (typeof moduleDefinition.initialize !== 'function') {
      this.logger.error(`Module ${moduleName} initialize must be a function`);
      return false;
    }
    
    return true;
  }

  /**
   * Get loaded module
   * @param {string} moduleName - Module name
   * @returns {Object} Module instance or null
   */
  getModule(moduleName) {
    return this.loadedModules.get(moduleName) || null;
  }

  /**
   * Get all loaded modules
   * @returns {Map} Map of loaded modules
   */
  getAllModules() {
    return this.loadedModules;
  }

  /**
   * Get module loading errors
   * @returns {Map} Map of module errors
   */
  getModuleErrors() {
    return this.moduleErrors;
  }

  /**
   * Reload a specific module
   * @param {string} moduleName - Module name to reload
   * @returns {Promise<Object>} Reloaded module
   */
  async reloadModule(moduleName) {
    try {
      this.logger.info(`Reloading module: ${moduleName}`);
      
      // Remove from cache using absolute path
      const targetPath = path.resolve(path.join(this.modulesPath, moduleName, 'index.js'));
      delete require.cache[targetPath];
      
      // Reload module
      const moduleInfo = {
        name: moduleName,
        path: path.join(this.modulesPath, moduleName),
        indexPath: targetPath
      };
      
      const reloadedModule = await this.loadModule(moduleInfo);
      
      this.logger.info(`Module ${moduleName} reloaded successfully`);
      return reloadedModule;
    } catch (error) {
      this.logger.error(`Failed to reload module ${moduleName}:`, error);
      throw error;
    }
  }

  /**
   * Get module dependency graph
   * @returns {Object} Dependency graph
   */
  getDependencyGraph() {
    const graph = {};
    
    for (const [moduleName, module] of this.loadedModules) {
      graph[moduleName] = {
        dependencies: module.dependencies || [],
        provides: module.provides || [],
        status: module.status || 'unknown'
      };
    }
    
    return graph;
  }

  /**
   * Check for circular dependencies
   * @returns {Array} Array of circular dependency chains
   */
  checkCircularDependencies() {
    const graph = this.getDependencyGraph();
    const visited = new Set();
    const recursionStack = new Set();
    const circularDeps = [];
    
    const dfs = (moduleName, path = []) => {
      if (recursionStack.has(moduleName)) {
        const cycle = [...path.slice(path.indexOf(moduleName)), moduleName];
        circularDeps.push(cycle);
        return;
      }
      
      if (visited.has(moduleName)) return;
      
      visited.add(moduleName);
      recursionStack.add(moduleName);
      
      const dependencies = graph[moduleName]?.dependencies || [];
      for (const dep of dependencies) {
        if (graph[dep]) {
          dfs(dep, [...path, moduleName]);
        }
      }
      
      recursionStack.delete(moduleName);
    };
    
    for (const moduleName of Object.keys(graph)) {
      if (!visited.has(moduleName)) {
        dfs(moduleName);
      }
    }
    
    return circularDeps;
  }

  /**
   * Get module statistics
   * @returns {Object} Module statistics
   */
  getStats() {
    const totalModules = this.loadedModules.size;
    const errorModules = this.moduleErrors.size;
    const healthyModules = totalModules - errorModules;
    
    return {
      total: totalModules,
      healthy: healthyModules,
      errors: errorModules,
      successRate: totalModules > 0 ? (healthyModules / totalModules) * 100 : 0,
      circularDependencies: this.checkCircularDependencies().length
    };
  }
}

module.exports = ModuleLoader;
