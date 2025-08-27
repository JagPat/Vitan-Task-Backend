const express = require('express');
const Joi = require('joi');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const otpRequestSchema = Joi.object({
  email: Joi.string().email().optional(),
  phone: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).optional()
}).or('email', 'phone');

const otpVerifySchema = Joi.object({
  email: Joi.string().email().optional(),
  phone: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).optional(),
  code: Joi.string().length(6).pattern(/^\d{6}$/).required()
}).or('email', 'phone');

const inviteSchema = Joi.object({
  email: Joi.string().email().optional(),
  phone: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).optional(),
  role: Joi.string().valid('member', 'manager').default('member')
}).or('email', 'phone');

// Get IP address from request
const getClientIP = (req) => {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         req.connection.socket?.remoteAddress || 
         '127.0.0.1';
};

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const authService = req.app.locals.container.get('authService');
    const health = await authService.healthCheck();
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

// Debug endpoint
router.get('/debug', (req, res) => {
  // Get the actual router stack to show mounted routes
  const routeStack = router.stack
    .filter(layer => layer.route)
    .map(layer => ({
      method: Object.keys(layer.route.methods)[0].toUpperCase(),
      path: layer.route.path,
      fullPath: `/api/modules/auth${layer.route.path}`
    }));

  res.json({
    success: true,
    data: {
      module: 'auth',
      version: '2.0.0',
      status: 'active',
      mountPoint: '/api/modules/auth',
      routes: routeStack,
      totalRoutes: routeStack.length
    }
  });
});

// Request OTP endpoint
router.post('/otp/request', async (req, res) => {
  try {
    const { error, value } = otpRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data'
      });
    }

    const { email, phone, channel } = value;
    const ipAddress = getClientIP(req);
    

    

    
    const authService = req.app.locals.container.get('authService');
    const result = await authService.requestOTP(email, phone, ipAddress);
    

    
    // Always return success to prevent user enumeration
    res.status(202).json({
      success: true,
      message: "If the account exists, an OTP has been sent"
    });

  } catch (error) {
    console.error('OTP request error:', error);
    // Return generic success even on error to prevent enumeration
    res.status(202).json({
      success: true,
      message: "If the account exists, an OTP has been sent"
    });
  }
});

// Verify OTP endpoint
router.post('/otp/verify', async (req, res) => {
  try {


    const { error, value } = otpVerifySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data'
      });
    }

    const { email, phone, code } = value;
    const ipAddress = getClientIP(req);
    

    
    const authService = req.app.locals.container.get('authService');
    const result = await authService.verifyOTP(email, phone, code, ipAddress);
    

    
    if (result.success) {
      res.json({
        success: true,
        data: {
          token: result.token,
          user: result.user
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'OTP verification failed'
      });
    }

  } catch (error) {
    console.error('OTP verification error:', error);
    return res.status(500).json({ success: false, error: 'OTP verification failed' });
  }
});

// Get current user endpoint
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const authService = req.app.locals.container.get('authService');
    const user = await authService.getCurrentUser(req.headers.authorization?.split(' ')[1]);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user information'
    });
  }
});

// Invite user endpoint (admin only)
router.post('/invite', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { error, value } = inviteSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data'
      });
    }

    const { email, phone, role } = value;
    const authService = req.app.locals.container.get('authService');
    
    // Get current user from token
    const currentUser = await authService.getCurrentUser(req.headers.authorization?.split(' ')[1]);
    
    const result = await authService.inviteUser(currentUser.id, email, phone, role);
    
    res.json({
      success: true,
      data: {
        message: 'User invited successfully',
        userId: result.userId
      }
    });

  } catch (error) {
    console.error('User invitation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to invite user'
    });
  }
});

// Logout endpoint
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    // For now, just return success - client should clear token
    // In the future, we can implement JWT denylist if needed
    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

module.exports = router;
