class SystemService {
  constructor() {
    this.startTime = new Date();
    this.metrics = {
      requests: 0,
      errors: 0,
      uptime: 0
    };
    this.modules = new Map();
    this.events = [];
  }

  // System health check
  async healthCheck() {
    const uptime = Date.now() - this.startTime.getTime();
    return {
      status: 'healthy',
      module: 'system',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime / 1000),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      platform: process.platform,
      nodeVersion: process.version
    };
  }

  // System status overview
  async getSystemStatus() {
    const uptime = Date.now() - this.startTime.getTime();
    return {
      status: 'operational',
      uptime: Math.floor(uptime / 1000),
      timestamp: new Date().toISOString(),
      modules: Array.from(this.modules.entries()).map(([name, status]) => ({
        name,
        status: status.status,
        lastCheck: status.lastCheck
      })),
      metrics: {
        totalRequests: this.metrics.requests,
        totalErrors: this.metrics.errors,
        errorRate: this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests * 100).toFixed(2) : 0
      }
    };
  }

  // Module management
  async registerModule(name, status = 'active') {
    this.modules.set(name, {
      status,
      lastCheck: new Date().toISOString(),
      registeredAt: new Date().toISOString()
    });
    return { name, status, registered: true };
  }

  async updateModuleStatus(name, status) {
    if (this.modules.has(name)) {
      const module = this.modules.get(name);
      module.status = status;
      module.lastCheck = new Date().toISOString();
      this.modules.set(name, module);
      return { name, status, updated: true };
    }
    return null;
  }

  async getModuleStatus(name) {
    return this.modules.get(name) || null;
  }

  async getAllModules() {
    return Array.from(this.modules.entries()).map(([name, module]) => ({
      name,
      ...module
    }));
  }

  // Performance metrics
  async getPerformanceMetrics() {
    const uptime = Date.now() - this.startTime.getTime();
    return {
      uptime: Math.floor(uptime / 1000),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      },
      cpu: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version
      },
      requests: {
        total: this.metrics.requests,
        errors: this.metrics.errors,
        success: this.metrics.requests - this.metrics.errors
      }
    };
  }

  // Event logging
  async logEvent(type, message, data = {}) {
    const event = {
      id: Date.now().toString(),
      type,
      message,
      data,
      timestamp: new Date().toISOString()
    };
    this.events.push(event);
    
    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
    
    return event;
  }

  async getEvents(filters = {}) {
    let filteredEvents = [...this.events];
    
    if (filters.type) {
      filteredEvents = filteredEvents.filter(event => event.type === filters.type);
    }
    
    if (filters.limit) {
      filteredEvents = filteredEvents.slice(-filters.limit);
    }
    
    return filteredEvents;
  }

  // Metrics tracking
  async incrementRequests() {
    this.metrics.requests++;
  }

  async incrementErrors() {
    this.metrics.errors++;
  }

  // System diagnostics
  async runDiagnostics() {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      system: await this.healthCheck(),
      modules: await this.getAllModules(),
      performance: await this.getPerformanceMetrics(),
      recentEvents: await this.getEvents({ limit: 10 })
    };
    
    return diagnostics;
  }

  // Configuration management
  async getConfiguration() {
    return {
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 3000,
      database: {
        url: process.env.DATABASE_URL ? 'configured' : 'not configured',
        ssl: process.env.DATABASE_SSL || 'false'
      },
      whatsapp: {
        accessToken: process.env.META_ACCESS_TOKEN ? 'configured' : 'not configured',
        phoneNumberId: process.env.META_PHONE_NUMBER_ID ? 'configured' : 'not configured'
      },
      security: {
        jwtSecret: process.env.JWT_SECRET ? 'configured' : 'not configured',
        cors: process.env.CORS_ORIGIN ? 'configured' : 'not configured'
      }
    };
  }
}

module.exports = new SystemService();
