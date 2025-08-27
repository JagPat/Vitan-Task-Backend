const { Pool } = require('pg');
const winston = require('winston');

/**
 * Shared Database Connection Manager
 * Provides centralized database connection management for all modules
 */
class DatabaseConnection {
  constructor() {
    this.pool = null;
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'database-connection.log' })
      ]
    });
    
    this.stats = {
      connectionsCreated: 0,
      connectionsReleased: 0,
      queriesExecuted: 0,
      errors: 0
    };
  }

  /**
   * Initialize database connection
   * @param {Object} config - Database configuration
   */
  async initialize(config = {}) {
    try {
      const dbConfig = {
        connectionString: config.connectionString || process.env.DATABASE_URL,
        ssl: config.ssl || (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false),
        max: config.max || 20,
        idleTimeoutMillis: config.idleTimeoutMillis || 30000,
        connectionTimeoutMillis: config.connectionTimeoutMillis || 2000,
        ...config
      };

      this.pool = new Pool(dbConfig);
      
      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      this.logger.info('Database connection initialized successfully', {
        host: this.pool.options.host || 'from_connection_string',
        database: this.pool.options.database || 'from_connection_string',
        maxConnections: dbConfig.max
      });

      // Set up pool event listeners
      this.setupPoolEventListeners();
      
      return true;
    } catch (error) {
      this.logger.error('Failed to initialize database connection:', error);
      throw error;
    }
  }

  /**
   * Set up pool event listeners for monitoring
   */
  setupPoolEventListeners() {
    if (!this.pool) return;

    this.pool.on('connect', (client) => {
      this.stats.connectionsCreated++;
      this.logger.debug('New database client connected');
    });

    this.pool.on('remove', (client) => {
      this.stats.connectionsReleased++;
      this.logger.debug('Database client removed from pool');
    });

    this.pool.on('error', (err, client) => {
      this.stats.errors++;
      this.logger.error('Unexpected error on idle client', err);
    });
  }

  /**
   * Get a database client from the pool
   * @returns {Promise<Object>} Database client
   */
  async getClient() {
    if (!this.pool) {
      throw new Error('Database connection not initialized');
    }
    
    try {
      const client = await this.pool.connect();
      this.stats.connectionsCreated++;
      return client;
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Failed to get database client:', error);
      throw error;
    }
  }

  /**
   * Execute a query with automatic client management
   * @param {string} query - SQL query
   * @param {Array} params - Query parameters
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Query result
   */
  async query(query, params = [], options = {}) {
    const client = await this.getClient();
    
    try {
      const startTime = Date.now();
      const result = await client.query(query, params);
      const duration = Date.now() - startTime;
      
      this.stats.queriesExecuted++;
      
      this.logger.debug('Database query executed', {
        query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
        params: params.length,
        duration,
        rowCount: result.rowCount
      });
      
      return result;
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Database query failed:', {
        query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
        params: params.length,
        error: error.message
      });
      throw error;
    } finally {
      client.release();
      this.stats.connectionsReleased++;
    }
  }

  /**
   * Execute a transaction
   * @param {Function} callback - Transaction callback function
   * @returns {Promise<any>} Transaction result
   */
  async transaction(callback) {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      this.stats.errors++;
      this.logger.error('Transaction failed, rolled back:', error);
      throw error;
    } finally {
      client.release();
      this.stats.connectionsReleased++;
    }
  }

  /**
   * Execute multiple queries in a transaction
   * @param {Array} queries - Array of {query, params} objects
   * @returns {Promise<Array>} Array of results
   */
  async batchQuery(queries) {
    return this.transaction(async (client) => {
      const results = [];
      for (const { query, params = [] } of queries) {
        const result = await client.query(query, params);
        results.push(result);
      }
      return results;
    });
  }

  /**
   * Health check for database connection
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      if (!this.pool) {
        return { status: 'error', message: 'Database pool not initialized' };
      }

      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW() as current_time, version() as db_version');
      client.release();

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        currentTime: result.rows[0].current_time,
        dbVersion: result.rows[0].db_version,
        poolStats: {
          totalCount: this.pool.totalCount,
          idleCount: this.pool.idleCount,
          waitingCount: this.pool.waitingCount
        },
        connectionStats: this.stats
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
        connectionStats: this.stats
      };
    }
  }

  /**
   * Get database statistics
   * @returns {Object} Database statistics
   */
  getStats() {
    return {
      ...this.stats,
      poolStats: this.pool ? {
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount
      } : null
    };
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.logger.info('Database connection closed');
    }
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      connectionsCreated: 0,
      connectionsReleased: 0,
      queriesExecuted: 0,
      errors: 0
    };
  }
}

// Create singleton instance
const databaseConnection = new DatabaseConnection();

module.exports = databaseConnection;

