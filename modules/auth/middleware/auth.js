const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization header required'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token required'
      });
    }

    const authService = req.app.locals.container.get('authService');
    const user = await authService.getCurrentUser(token);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Attach user to request for downstream middleware/routes
    req.user = user;
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

const adminMiddleware = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    next();

  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }
};

const managerMiddleware = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Manager or admin access required'
      });
    }

    next();

  } catch (error) {
    console.error('Manager middleware error:', error);
    res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  managerMiddleware
};
