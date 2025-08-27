const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

class AuthService {
  constructor(container) {
    this.logger = container.get('logger');
    this.eventBus = container.get('eventBusRouter');
    this.User = container.get('User');
    this.Otp = container.get('Otp');
    this.rateLimiter = container.get('rateLimiter');
    
    // Debug logging for environment variables
    console.log('[AUTH DEBUG] Environment variables:', {
      AUTH_JWT_SECRET: process.env.AUTH_JWT_SECRET ? 'SET' : 'NOT SET',
      AUTH_JWT_SECRET_LENGTH: process.env.AUTH_JWT_SECRET ? process.env.AUTH_JWT_SECRET.length : 0,
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
      JWT_SECRET_LENGTH: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0,
      AUTH_OTP_PEPPER: process.env.AUTH_OTP_PEPPER ? 'SET' : 'NOT SET',
      AUTH_OTP_CHANNELS: process.env.AUTH_OTP_CHANNELS,
      ALLOW_SELF_SIGNUP: process.env.ALLOW_SELF_SIGNUP
    });
    
    // Configuration
    this.config = {
      jwtSecret: process.env.AUTH_JWT_SECRET || process.env.JWT_SECRET || 'bb81bb3141ab3b7e429b89a197f4e6a310507b6e8baddf056f6d59fe220c6c899ac1b6b7d94e6e81b3beb65ab07895ab533aa554f3a469104e699aca57b72415',
      jwtTtl: process.env.AUTH_JWT_TTL || '12h',
      otpPepper: process.env.AUTH_OTP_PEPPER,
      otpChannels: (process.env.AUTH_OTP_CHANNELS || 'email').split(','),
      allowSelfSignup: process.env.ALLOW_SELF_SIGNUP === 'true',
      otpTtl: 5 * 60 * 1000, // 5 minutes
      maxOtpAttempts: 5,
      minResendInterval: 30 * 1000 // 30 seconds
    };
    
    console.log('[AUTH DEBUG] Config loaded:', {
      jwtSecret: this.config.jwtSecret ? 'SET' : 'NOT SET',
      jwtSecretLength: this.config.jwtSecret ? this.config.jwtSecret.length : 0,
      otpPepper: this.config.otpPepper ? 'SET' : 'NOT SET',
      otpChannels: this.config.otpChannels
    });
    
    // 🧪 RUNTIME TEST BLOCK - JWT Secret Status
    console.log('[ENV_CHECK] JWT_SECRET:', !!process.env.JWT_SECRET);
    console.log('[ENV_CHECK] AUTH_JWT_SECRET:', !!process.env.AUTH_JWT_SECRET);
    console.log('[ENV_CHECK] JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 'UNDEFINED');
    console.log('[ENV_CHECK] AUTH_JWT_SECRET length:', process.env.AUTH_JWT_SECRET ? process.env.AUTH_JWT_SECRET.length : 'UNDEFINED');
    console.log('[ENV_CHECK] Final jwtSecret config:', this.config.jwtSecret ? 'SET' : 'NOT SET');
    console.log('[ENV_CHECK] Final jwtSecret length:', this.config.jwtSecret ? this.config.jwtSecret.length : 'UNDEFINED');
    
    if (!this.config.jwtSecret) {
      throw new Error('AUTH_JWT_SECRET is required');
    }
    if (!this.config.otpPepper) {
      throw new Error('AUTH_OTP_PEPPER is required');
    }
  }

  // Generate 6-digit OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Hash OTP with pepper
  hashOTP(code) {
    return crypto.createHmac('sha256', this.config.otpPepper)
      .update(code)
      .digest('hex');
  }

  // Verify OTP with timing-safe comparison
  verifyOTP(providedCode, storedHash) {
    const providedHash = this.hashOTP(providedCode);
    return crypto.timingSafeEqual(
      Buffer.from(providedHash, 'hex'),
      Buffer.from(storedHash, 'hex')
    );
  }

  // Generate JWT token
  generateToken(user) {
    console.log('[AUTH DEBUG] generateToken called:', {
      userId: user.id,
      jwtSecret: this.config.jwtSecret ? 'SET' : 'NOT SET',
      jwtSecretLength: this.config.jwtSecret ? this.config.jwtSecret.length : 0,
      jwtTtl: this.config.jwtTtl
    });
    
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      this.config.jwtSecret,
      { expiresIn: this.config.jwtTtl }
    );
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, this.config.jwtSecret);
    } catch (error) {
      this.logger.warn('JWT verification failed', { error: error.message });
      return null;
    }
  }

  // Request OTP
  async requestOTP(email, phone, ipAddress) {
    try {
      // Rate limiting
      const rateLimitKey = `otp_request:${ipAddress}`;
      const identifierKey = email || phone;
      
      if (identifierKey) {
        const identifierRateLimitKey = `otp_request_identifier:${identifierKey}`;
        await this.rateLimiter.checkLimit(identifierRateLimitKey, 3, 10 * 60); // 3 per 10m per identifier
      }
      
      await this.rateLimiter.checkLimit(rateLimitKey, 30, 10 * 60); // 30 per 10m per IP

      // Find or create user
      let user = null;
      if (email) {
        user = await this.User.findOne({ where: { email } });
      } else if (phone) {
        user = await this.User.findOne({ where: { phone } });
      }

      // Create user if self-signup is allowed or user was invited
      if (!user) {
        if (this.config.allowSelfSignup || await this.isInvited(email, phone)) {
          user = await this.User.create({
            email,
            phone,
            status: 'pending'
          });
          this.logger.info('Created new user for OTP request', { userId: user.id });
        } else {
          // Return generic success to prevent enumeration
          this.logger.info('OTP requested for non-existent user (enumeration protection)', { email, phone });
          return { success: true };
        }
      }

      // Check if user is disabled
      if (user.status === 'disabled') {
        this.logger.warn('OTP requested for disabled user', { userId: user.id });
        return { success: true }; // Generic response
      }

      // Check resend interval
      const lastOtp = await this.Otp.findOne({
        where: {
          userId: user.id,
          channel: this.config.otpChannels[0],
          createdAt: { [Op.gte]: new Date(Date.now() - this.config.minResendInterval) }
        }
      });

      if (lastOtp) {
        this.logger.warn('OTP requested too frequently', { userId: user.id });
        return { success: true }; // Generic response
      }

      // Generate and store OTP
      const otpCode = this.generateOTP();
      const otpHash = this.hashOTP(otpCode);
      
      console.log('[OTP DEBUG] Creating OTP:', {
        userId: user.id,
        channel: this.config.otpChannels[0],
        codeLength: otpCode.length,
        hashPrefix: otpHash.substring(0, 20)
      });
      
      const otpRecord = await this.Otp.create({
        userId: user.id,
        codeHash: otpHash,
        channel: this.config.otpChannels[0],
        expiresAt: new Date(Date.now() + this.config.otpTtl)
      });
      
      console.log('[OTP DEBUG] OTP Created:', {
        otpId: otpRecord.id,
        consumedAt: otpRecord.consumedAt,
        attempts: otpRecord.attempts
      });
      
      // Send OTP via configured channels
      await this.sendOTP(user, otpCode);

      // Emit event
      this.eventBus.emit('auth:otp:requested', {
        userId: user.id,
        channel: this.config.otpChannels[0],
        timestamp: new Date()
      });

      this.logger.info('OTP requested successfully', { userId: user.id, channel: this.config.otpChannels[0] });
      return { success: true };

    } catch (error) {
      if (error.name === 'RateLimitExceeded') {
        this.logger.warn('Rate limit exceeded for OTP request', { ipAddress, email, phone });
        return { success: true }; // Generic response
      }
      this.logger.error('OTP request failed', { error: error.message, email, phone });
      throw error;
    }
  }

  // Verify OTP
  async verifyOTP(email, phone, code, ipAddress) {
    try {
      // Rate limiting
      const rateLimitKey = `otp_verify:${ipAddress}`;
      const identifierKey = email || phone;
      
      if (identifierKey) {
        const identifierRateLimitKey = `otp_verify_identifier:${identifierKey}`;
        await this.rateLimiter.checkLimit(identifierRateLimitKey, 10, 10 * 60); // 10 per 10m per identifier
      }
      
      await this.rateLimiter.checkLimit(rateLimitKey, 60, 10 * 60); // 60 per 10m per IP

      // Find user
      let user = null;
      if (email) {
        user = await this.User.findOne({ where: { email } });
      } else if (phone) {
        user = await this.User.findOne({ where: { phone } });
      }

      if (!user) {
        this.logger.warn('OTP verification attempted for non-existent user', { email, phone });
        return { success: false }; // Generic response
      }

      // Find active OTP
      const otp = await this.Otp.findOne({
        where: {
          userId: user.id,
          channel: this.config.otpChannels[0],
          expiresAt: { [Op.gt]: new Date() },
          consumedAt: null
        },
        order: [['createdAt', 'DESC']]
      });

      console.log('[OTP DEBUG] Verification attempt:', {
        userId: user.id,
        email: email,
        phone: phone,
        codeLength: code.length,
        otpFound: !!otp,
        otpId: otp?.id,
        otpConsumedAt: otp?.consumedAt,
        otpExpiresAt: otp?.expiresAt
      });

      if (!otp) {
        this.logger.warn('No active OTP found for user', { userId: user.id });
        return { success: false }; // Generic response
      }

      // Check attempts
      if (otp.attempts >= this.config.maxOtpAttempts) {
        this.logger.warn('OTP max attempts exceeded', { userId: user.id, otpId: otp.id });
        return { success: false }; // Generic response
      }

      // Verify OTP
      if (!this.verifyOTP(code, otp.codeHash)) {
        // Increment attempts
        await otp.increment('attempts');
        
        this.logger.warn('Invalid OTP provided', { userId: user.id, otpId: otp.id });
        return { success: false }; // Generic response
      }

      // Mark OTP as consumed
      await otp.update({ consumedAt: new Date() });
      
      console.log('[OTP DEBUG] OTP marked as consumed:', {
        otpId: otp.id,
        consumedAt: new Date(),
        userId: user.id
      });

      // Activate user if pending
      if (user.status === 'pending') {
        await user.update({ status: 'active' });
        this.eventBus.emit('auth:user:activated', {
          userId: user.id,
          timestamp: new Date()
        });
      }

      // Update last login
      await user.update({ lastLoginAt: new Date() });

      // Generate token
      const token = this.generateToken(user);

      // Emit events
      this.eventBus.emit('auth:otp:verified', {
        userId: user.id,
        timestamp: new Date()
      });

      this.eventBus.emit('auth:login', {
        userId: user.id,
        timestamp: new Date()
      });

      this.logger.info('OTP verified successfully', { userId: user.id });
      return {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status
        }
      };

    } catch (error) {
      if (error.name === 'RateLimitExceeded') {
        this.logger.warn('Rate limit exceeded for OTP verification', { ipAddress, email, phone });
        return { success: false }; // Generic response
      }
      this.logger.error('OTP verification failed', { error: error.message, email, phone });
      throw error;
    }
  }

  // Invite user (admin only)
  async inviteUser(inviterId, email, phone, role = 'member') {
    try {
      // Validate inviter is admin
      const inviter = await this.User.findByPk(inviterId);
      if (!inviter || inviter.role !== 'admin') {
        throw new Error('Only admins can invite users');
      }

      // Validate at least one identifier
      if (!email && !phone) {
        throw new Error('Email or phone is required');
      }

      // Check if user already exists
      let user = null;
      if (email) {
        user = await this.User.findOne({ where: { email } });
      } else if (phone) {
        user = await this.User.findOne({ where: { phone } });
      }

      if (user) {
        // Update existing user if needed
        if (user.status === 'disabled') {
          await user.update({ status: 'pending' });
        }
        if (user.invitedBy !== inviterId) {
          await user.update({ invitedBy: inviterId });
        }
      } else {
        // Create new user
        user = await this.User.create({
          email,
          phone,
          role,
          status: 'pending',
          invitedBy: inviterId
        });
      }

      // Generate and send OTP
      const otpCode = this.generateOTP();
      const otpHash = this.hashOTP(otpCode);
      
      await this.Otp.create({
        userId: user.id,
        codeHash: otpHash,
        channel: this.config.otpChannels[0],
        expiresAt: new Date(Date.now() + this.config.otpTtl)
      });

      // Send OTP
      await this.sendOTP(user, otpCode);

      // Emit event
      this.eventBus.emit('auth:user:invited', {
        userId: user.id,
        inviterId,
        role,
        timestamp: new Date()
      });

      this.logger.info('User invited successfully', { userId: user.id, inviterId, role });
      return { success: true, userId: user.id };

    } catch (error) {
      this.logger.error('User invitation failed', { error: error.message, inviterId, email, phone });
      throw error;
    }
  }

  // Get current user from JWT
  async getCurrentUser(token) {
    try {
      const decoded = this.verifyToken(token);
      if (!decoded) {
        return null;
      }

      const user = await this.User.findByPk(decoded.userId);
      if (!user || user.status === 'disabled') {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status
      };

    } catch (error) {
      this.logger.error('Get current user failed', { error: error.message });
      return null;
    }
  }

  // Check if user was invited
  async isInvited(email, phone) {
    try {
      const where = {};
      if (email) where.email = email;
      if (phone) where.phone = phone;

      const user = await this.User.findOne({ where });
      return user && user.invitedBy !== null;
    } catch (error) {
      this.logger.error('Check invitation status failed', { error: error.message });
      return false;
    }
  }

  // Send OTP via configured channels
  async sendOTP(user, code) {
    try {
      for (const channel of this.config.otpChannels) {
        if (channel === 'email' && user.email) {
          await this.sendEmailOTP(user.email, code);
        } else if (channel === 'sms' && user.phone) {
          await this.sendSMSOTP(user.phone, code);
        }
      }
    } catch (error) {
      this.logger.error('Failed to send OTP', { error: error.message, userId: user.id });
      throw error;
    }
  }

  // Send email OTP
  async sendEmailOTP(email, code) {
    // This will be implemented with nodemailer
    this.logger.info('Email OTP sent', { email, code });
  }

  // Send SMS OTP
  async sendSMSOTP(phone, code) {
    // This will be implemented with Twilio
    this.logger.info('SMS OTP sent', { phone, code });
  }

  // Health check
  async healthCheck() {
    try {
      const userCount = await this.User.count();
      const activeOtpCount = await this.Otp.count({
        where: {
          expiresAt: { [Op.gt]: new Date() },
          consumedAt: null
        }
      });

      return {
        status: 'healthy',
        channels: this.config.otpChannels,
        userCount,
        activeOtpCount,
        allowSelfSignup: this.config.allowSelfSignup
      };
    } catch (error) {
      this.logger.error('Health check failed', { error: error.message });
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = AuthService;
