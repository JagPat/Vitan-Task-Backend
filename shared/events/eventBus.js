const winston = require('winston');

/**
 * Event Bus for Inter-Module Communication
 * Provides loose coupling between modules through event-driven architecture
 */
class EventBus {
  constructor() {
    this.listeners = new Map();
    this.middleware = [];
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'event-bus.log' })
      ]
    });
    
    this.stats = {
      eventsEmitted: 0,
      eventsHandled: 0,
      errors: 0
    };
  }

  /**
   * Register an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event handler function
   * @param {Object} options - Listener options
   */
  on(event, callback, options = {}) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    const listener = {
      callback,
      moduleName: options.moduleName || 'unknown',
      priority: options.priority || 0,
      id: options.id || `${event}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    this.listeners.get(event).push(listener);
    
    // Sort by priority (higher priority first)
    this.listeners.get(event).sort((a, b) => b.priority - a.priority);
    
    this.logger.info(`Event listener registered for '${event}'`, {
      moduleName: listener.moduleName,
      priority: listener.priority,
      listenerId: listener.id
    });
  }

  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {string} listenerId - Listener ID to remove
   */
  off(event, listenerId) {
    if (!this.listeners.has(event)) return;
    
    const listeners = this.listeners.get(event);
    const initialLength = listeners.length;
    
    this.listeners.set(event, listeners.filter(listener => listener.id !== listenerId));
    
    if (listeners.length !== initialLength) {
      this.logger.info(`Event listener removed for '${event}'`, { listenerId });
    }
  }

  /**
   * Emit an event to all registered listeners
   * @param {string} event - Event name
   * @param {any} data - Event data
   * @param {Object} options - Emission options
   */
  async emit(event, data, options = {}) {
    const listeners = this.listeners.get(event) || [];
    
    if (listeners.length === 0) {
      this.logger.debug(`No listeners for event '${event}'`);
      return;
    }
    
    this.stats.eventsEmitted++;
    
    this.logger.debug(`Emitting event '${event}' to ${listeners.length} listeners`, {
      dataPreview: typeof data === 'object' ? Object.keys(data) : typeof data,
      options
    });
    
    // Process middleware
    let processedData = data;
    for (const middleware of this.middleware) {
      try {
        processedData = await middleware(event, processedData, options);
      } catch (error) {
        this.logger.error(`Middleware error for event '${event}':`, error);
      }
    }
    
    // Execute listeners
    const promises = listeners.map(async (listener) => {
      try {
        await listener.callback(processedData, options);
        this.stats.eventsHandled++;
        
        this.logger.debug(`Event '${event}' handled successfully`, {
          moduleName: listener.moduleName,
          listenerId: listener.id
        });
      } catch (error) {
        this.stats.errors++;
        this.logger.error(`Error in event handler for '${event}'`, {
          moduleName: listener.moduleName,
          listenerId: listener.id,
          error: error.message
        });
      }
    });
    
    if (options.waitForAll) {
      await Promise.allSettled(promises);
    } else {
      // Fire and forget
      Promise.allSettled(promises).catch(error => {
        this.logger.error(`Unhandled error in event '${event}' listeners:`, error);
      });
    }
  }

  /**
   * Emit event to specific module
   * @param {string} targetModule - Target module name
   * @param {string} event - Event name
   * @param {any} data - Event data
   * @param {Object} options - Emission options
   */
  async emitToModule(targetModule, event, data, options = {}) {
    const moduleEvent = `${targetModule}:${event}`;
    await this.emit(moduleEvent, data, { ...options, targetModule });
  }

  /**
   * Emit event and wait for response
   * @param {string} event - Event name
   * @param {any} data - Event data
   * @param {Object} options - Emission options
   * @returns {Promise<any>} Response from listeners
   */
  async emitAndWait(event, data, options = {}) {
    const responseEvent = `${event}:response`;
    const responsePromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Event '${event}' response timeout`));
      }, options.timeout || 5000);
      
      this.once(responseEvent, (response) => {
        clearTimeout(timeout);
        resolve(response);
      });
    });
    
    await this.emit(event, data, { ...options, responseEvent });
    return responsePromise;
  }

  /**
   * Register event middleware
   * @param {Function} middleware - Middleware function
   */
  use(middleware) {
    this.middleware.push(middleware);
    this.logger.info('Event middleware registered');
  }

  /**
   * Get event statistics
   * @returns {Object} Event bus statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeListeners: Array.from(this.listeners.entries()).reduce((acc, [event, listeners]) => {
        acc[event] = listeners.length;
        return acc;
      }, {}),
      totalEvents: Object.keys(this.listeners).length
    };
  }

  /**
   * Clear all listeners for an event
   * @param {string} event - Event name
   */
  clear(event) {
    if (this.listeners.has(event)) {
      this.listeners.delete(event);
      this.logger.info(`All listeners cleared for event '${event}'`);
    }
  }

  /**
   * Clear all listeners
   */
  clearAll() {
    this.listeners.clear();
    this.logger.info('All event listeners cleared');
  }

  /**
   * Get all registered events
   * @returns {string[]} Array of event names
   */
  getEvents() {
    return Array.from(this.listeners.keys());
  }

  /**
   * Get listeners for a specific event
   * @param {string} event - Event name
   * @returns {Array} Array of listeners
   */
  getListeners(event) {
    return this.listeners.get(event) || [];
  }
}

module.exports = EventBus;

