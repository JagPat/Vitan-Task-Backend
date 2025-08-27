const express = require('express');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// In-memory OTP storage (for production, use Redis or database)
const otpStorage = new Map();

// OTP cleanup - remove expired OTPs every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of otpStorage.entries()) {
    if (now > data.expiresAt) {
      otpStorage.delete(key);
    }
  }
}, 5 * 60 * 1000);

module.exports = {
  name: 'auth',
  version: '2.0.0',
  description: 'OTP-based authentication with real email sending',
  dependencies: ['logger'],
  
  async initialize(serviceContainer, app) {
    try {
      const logger = serviceContainer.get('logger');
      
      // Create email transporter (using Gmail SMTP)
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || process.env.EMAIL_FROM,
          pass: process.env.SMTP_PASS
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
      });
      
      // Helper function to generate OTP
      const generateOTP = () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
      };
      
      // Helper function to send email
      const sendOTPEmail = async (email, otp) => {
        const mailOptions = {
          from: process.env.EMAIL_FROM || process.env.SMTP_USER || 'WhatsTask <noreply@whatstask.com>',
          to: email,
          subject: 'Your WhatsTask OTP Code',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">WhatsTask - OTP Verification</h2>
              <p>Your One-Time Password (OTP) for WhatsTask is:</p>
              <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
                <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
              </div>
              <p>This OTP will expire in 10 minutes.</p>
              <p>If you didn't request this OTP, please ignore this email.</p>
              <hr style="margin: 30px 0;">
              <p style="color: #666; font-size: 12px;">This is an automated message from WhatsTask.</p>
            </div>
          `
        };
        
        return await transporter.sendMail(mailOptions);
      };
      
      // Create router with enhanced routes
      const router = express.Router();
      
      // Import Google OAuth routes
      const googleAuthRoutes = require('./routes/googleAuth');
      const adminRoutes = require('./routes/admin');
      
      // Health check endpoint
      router.get('/health', async (req, res) => {
        res.json({
          success: true,
          data: {
            status: 'healthy',
            module: 'auth',
            version: '2.0.0',
            emailConfigured: !!(process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_HOST),
            activeOTPs: otpStorage.size
          }
        });
      });
      
      // Request OTP endpoint
      router.post('/otp/request', async (req, res) => {
        try {
          const { email, phone } = req.body;
          
          if (!email && !phone) {
            return res.status(400).json({
              success: false,
              error: 'Email or phone number is required'
            });
          }
          
          // For now, only support email OTP
          if (!email) {
            return res.status(400).json({
              success: false,
              error: 'Email is required for OTP delivery'
            });
          }
          
          logger.info('OTP request received', { email, phone });
          
          // Generate OTP
          const otp = generateOTP();
          const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes
          
          // Store OTP
          const otpKey = email.toLowerCase();
          otpStorage.set(otpKey, {
            otp,
            email,
            expiresAt,
            attempts: 0,
            createdAt: Date.now()
          });
          
          // Send OTP email
          try {
            if (process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_HOST) {
              await sendOTPEmail(email, otp);
              logger.info('OTP email sent successfully', { email });
            } else {
              logger.warn('Email credentials not configured, OTP not sent', { email });
            }
          } catch (emailError) {
            logger.error('Failed to send OTP email', { email, error: emailError.message });
          }
          
          // Always return success to prevent user enumeration
          const exposeOtp = process.env.EXPOSE_OTP === 'true' && process.env.NODE_ENV !== 'production';
          res.status(202).json({
            success: true,
            message: "If the account exists, an OTP has been sent to your email",
            ...(exposeOtp ? { otp } : {})
          });
          
        } catch (error) {
          logger.error('OTP request error:', error);
          const exposeOtp = process.env.EXPOSE_OTP === 'true' && process.env.NODE_ENV !== 'production';
          res.status(202).json({
            success: true,
            message: "If the account exists, an OTP has been sent to your email",
            ...(exposeOtp ? { note: 'OTP not exposed on error in dev mode' } : {})
          });
        }
      });
      
      // Verify OTP endpoint
      router.post('/otp/verify', async (req, res) => {
        try {
          const { email, phone, code } = req.body;
          
          if (!email && !phone) {
            return res.status(400).json({
              success: false,
              error: 'Email or phone number is required'
            });
          }
          
          if (!code) {
            return res.status(400).json({
              success: false,
              error: 'OTP code is required'
            });
          }
          
          logger.info('OTP verification received', { email, phone, code });
          
          const otpKey = (email || phone).toLowerCase();
          const storedOTP = otpStorage.get(otpKey);
          
          if (!storedOTP) {
            logger.warn('OTP not found or expired', { otpKey });
            return res.status(400).json({
              success: false,
              error: 'Invalid or expired OTP'
            });
          }
          
          // Check if OTP is expired
          if (Date.now() > storedOTP.expiresAt) {
            otpStorage.delete(otpKey);
            logger.warn('OTP expired', { otpKey });
            return res.status(400).json({
              success: false,
              error: 'OTP has expired'
            });
          }
          
          // Check attempts limit
          if (storedOTP.attempts >= 3) {
            otpStorage.delete(otpKey);
            logger.warn('Too many OTP attempts', { otpKey });
            return res.status(400).json({
              success: false,
              error: 'Too many failed attempts'
            });
          }
          
          // Verify OTP
          if (storedOTP.otp !== code) {
            storedOTP.attempts++;
            logger.warn('Invalid OTP attempt', { otpKey, attempts: storedOTP.attempts });
            return res.status(400).json({
              success: false,
              error: 'Invalid OTP code'
            });
          }
          
          // OTP verified successfully
          otpStorage.delete(otpKey);
          logger.info('OTP verified successfully', { otpKey });
          
          // Generate session token (simple JWT-like token for demo)
          const token = 'wt_' + crypto.randomBytes(32).toString('hex');
          
          res.json({
            success: true,
            data: {
              token,
              user: {
                id: 'user_' + crypto.randomBytes(8).toString('hex'),
                email: email || phone,
                role: 'user',
                verified: true
              }
            }
          });
          
        } catch (error) {
          logger.error('OTP verification error:', error);
          res.status(500).json({
            success: false,
            error: 'OTP verification failed'
          });
        }
      });
      
      // Debug endpoint
      router.get('/debug', (req, res) => {
        const activeOTPs = Array.from(otpStorage.entries()).map(([key, data]) => ({
          key,
          expiresAt: new Date(data.expiresAt).toISOString(),
          attempts: data.attempts,
          createdAt: new Date(data.createdAt).toISOString()
        }));
        
        res.json({
          success: true,
          data: {
            module: 'auth',
            version: '2.0.0',
            status: 'active',
            mountPoint: '/api/modules/auth',
            emailConfigured: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
            activeOTPs: activeOTPs.length,
            routes: [
              { method: 'GET', path: '/health', fullPath: '/api/modules/auth/health' },
              { method: 'POST', path: '/otp/request', fullPath: '/api/modules/auth/otp/request' },
              { method: 'POST', path: '/otp/verify', fullPath: '/api/modules/auth/otp/verify' },
              { method: 'GET', path: '/debug', fullPath: '/api/modules/auth/debug' }
            ],
            totalRoutes: 4
          }
        });
      });

      // Dev-only OTP fetch: GET /debug/otp?email=...
      router.get('/debug/otp', (req, res) => {
        if (!(process.env.EXPOSE_OTP === 'true' && process.env.NODE_ENV !== 'production')) {
          return res.status(403).json({ success: false, error: 'Forbidden' });
        }
        const { email } = req.query;
        if (!email) {
          return res.status(400).json({ success: false, error: 'email is required' });
        }
        const otpKey = String(email).toLowerCase();
        const record = otpStorage.get(otpKey);
        if (!record) {
          return res.json({ success: true, data: { exists: false } });
        }
        return res.json({ success: true, data: { exists: true, otp: record.otp, expiresAt: record.expiresAt } });
      });
      
      // Mount Google OAuth routes
      router.use('/google', googleAuthRoutes);
      
      // Mount admin routes
      router.use('/admin', adminRoutes);
      
      // Register routes
      app.use('/api/modules/auth', router);
      logger.info('Auth module routes registered at /api/modules/auth');
      
      logger.info('Auth module initialized successfully with email support');
      return true;
      
    } catch (error) {
      const logger = serviceContainer.get('logger');
      logger.error('Failed to initialize auth module:', error);
      throw error;
    }
  },
  
  health: async (serviceContainer) => {
    return {
      status: 'healthy',
      module: 'auth',
      version: '2.0.0',
      features: ['email-otp', 'in-memory-storage', 'google-oauth', 'admin-routes'],
      activeOTPs: otpStorage.size
    };
  },
  
  shutdown: async () => {
    otpStorage.clear();
    return true;
  }
};
// Force Railway redeployment - Wed Aug 27 18:37:43 IST 2025
