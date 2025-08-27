/**
 * Request ID middleware
 */
const requestId = (req, res, next) => {
  // Generate a simple request ID
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Add request ID to response headers
  res.setHeader('X-Request-ID', req.requestId);
  
  next();
};

module.exports = { requestId };
