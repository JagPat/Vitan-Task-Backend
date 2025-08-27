const winston = require('winston');

/**
 * Create a validated logger with required transports
 * @param {string} name - Logger name/context
 * @param {string} logFile - Log file name (optional)
 * @returns {winston.Logger} Configured logger
 */
function createLogger(name, logFile = null) {
  const transports = [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ];

  // Add file transport if specified
  if (logFile) {
    transports.push(
      new winston.transports.File({ 
        filename: logFile,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        )
      })
    );
  }

  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    transports,
    // Ensure we don't exit on error
    exitOnError: false
  });

  // Validate logger has transports
  if (logger.transports.length === 0) {
    throw new Error(`Logger '${name}' has no transports configured - this will cause memory leaks`);
  }

  // Add error handling for transports
  logger.transports.forEach(transport => {
    if (transport.on) {
      transport.on('error', (error) => {
        console.error(`Logger transport error for ${name}:`, error);
      });
    }
  });

  return logger;
}

/**
 * Validate that a logger has transports
 * @param {winston.Logger} logger - Logger to validate
 * @param {string} context - Context for error messages
 */
function validateLogger(logger, context = 'unknown') {
  if (!logger || !logger.transports || logger.transports.length === 0) {
    throw new Error(`Logger validation failed for ${context}: no transports configured`);
  }
}

module.exports = {
  createLogger,
  validateLogger
};
