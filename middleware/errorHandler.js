/**
 * Error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Default error response
  const errorResponse = {
    error: err.message || 'Internal Server Error',
    status: err.status || 500,
    timestamp: new Date().toISOString()
  };

  // Send error response
  res.status(errorResponse.status).json(errorResponse);
};

module.exports = { errorHandler };
// Force rebuild - Sat Aug 23 07:35:46 IST 2025
