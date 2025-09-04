const jwt = require('jsonwebtoken');

/**
 * Authentication middleware for protecting routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      status: 401 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(403).json({ 
      error: 'Invalid or expired token',
      status: 403 
    });
  }
};

/**
 * Role-based authorization middleware
 * @param {string|Array} allowedRoles - Single role or array of roles
 * @returns {Function} Express middleware function
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        status: 401 
      });
    }

    const userRole = req.user.role;
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        status: 403,
        required: roles,
        current: userRole
      });
    }

    next();
  };
};

/**
 * Permission-based authorization middleware
 * @param {string|Array} requiredPermissions - Single permission or array of permissions
 * @returns {Function} Express middleware function
 */
const requirePermission = (requiredPermissions) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        status: 401 
      });
    }

    try {
      const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
      const userPermissions = req.user.permissions || [];

      // Check if user has any of the required permissions
      const hasPermission = permissions.some(permission => userPermissions.includes(permission));

      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          status: 403,
          required: permissions,
          current: userPermissions
        });
      }

      next();
    } catch (error) {
      console.error('Permission check failed:', error);
      return res.status(500).json({ 
        error: 'Permission verification failed',
        status: 500 
      });
    }
  };
};

/**
 * Combined role and permission middleware
 * @param {Object} options - Configuration object
 * @param {string|Array} options.roles - Required roles
 * @param {string|Array} options.permissions - Required permissions
 * @returns {Function} Express middleware function
 */
const requireAuth = (options = {}) => {
  return (req, res, next) => {
    // First authenticate the token
    authenticateToken(req, res, (err) => {
      if (err) return;

      // Then check roles if specified
      if (options.roles) {
        const roleCheck = requireRole(options.roles);
        return roleCheck(req, res, (err) => {
          if (err) return;

          // Finally check permissions if specified
          if (options.permissions) {
            const permissionCheck = requirePermission(options.permissions);
            return permissionCheck(req, res, next);
          }

          next();
        });
      }

      // Check permissions only if no roles specified
      if (options.permissions) {
        const permissionCheck = requirePermission(options.permissions);
        return permissionCheck(req, res, next);
      }

      next();
    });
  };
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      req.user = decoded;
    } catch (error) {
      // Ignore invalid tokens in optional auth
      console.warn('Optional auth token verification failed:', error.message);
    }
  }

  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  requirePermission,
  requireAuth,
  optionalAuth
};
