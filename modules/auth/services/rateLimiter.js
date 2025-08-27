class RateLimiter {
  constructor() {
    this.limits = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000); // Cleanup every minute
  }

  async checkLimit(key, maxRequests, windowMs) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.limits.has(key)) {
      this.limits.set(key, []);
    }
    
    const requests = this.limits.get(key);
    
    // Remove expired requests
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    if (validRequests.length >= maxRequests) {
      const error = new Error('Rate limit exceeded');
      error.name = 'RateLimitExceeded';
      throw error;
    }
    
    // Add current request
    validRequests.push(now);
    this.limits.set(key, validRequests);
    
    return true;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, requests] of this.limits.entries()) {
      // Keep only requests from last 10 minutes
      const validRequests = requests.filter(timestamp => now - timestamp < 10 * 60 * 1000);
      if (validRequests.length === 0) {
        this.limits.delete(key);
      } else {
        this.limits.set(key, validRequests);
      }
    }
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

module.exports = RateLimiter;
