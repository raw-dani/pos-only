/**
 * Production Middleware
 * Includes rate limiting, HTTPS redirect, and production optimizations
 */

const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

// Rate limiter for general API requests
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true
});

// Stricter rate limiter for login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: {
    error: 'Too many login attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true,
  skipSuccessfulRequests: true // only count failed requests
});

// Production logger - replaces console.log in production
const productionLogger = (req, res, next) => {
  // In production, we don't use console.log for debugging
  // The original console.log will still work but won't output in production
  // unless NODE_ENV is set to development
  
  // Override console.log for production to reduce noise
  if (process.env.NODE_ENV === 'production') {
    const originalLog = console.log;
    console.log = function(...args) {
      // Only log errors in production
      if (args[0] && (args[0].toString().includes('Error') || args[0].toString().includes('error'))) {
        originalLog.apply(console, args);
      }
    };
  }
  
  next();
};

// HTTPS redirect middleware (only for production)
const httpsRedirect = (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.protocol !== 'https') {
    // Check if behind a proxy (Heroku, AWS, etc.)
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect('https://' + req.hostname + req.url);
    }
  }
  next();
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Hide X-Powered-By
  res.removeHeader('X-Powered-By');
  
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;");
  
  next();
};

// SSL options for HTTPS server
const getSslOptions = () => {
  const sslPath = process.env.SSL_PATH || path.join(__dirname, '../ssl');
  
  try {
    return {
      key: fs.readFileSync(path.join(sslPath, 'server.key')),
      cert: fs.readFileSync(path.join(sslPath, 'server.cert'))
    };
  } catch (error) {
    console.log('SSL certificates not found. Using HTTP server.');
    return null;
  }
};

// Check if SSL is configured
const isSslConfigured = () => {
  return getSslOptions() !== null;
};

module.exports = {
  generalLimiter,
  loginLimiter,
  productionLogger,
  httpsRedirect,
  securityHeaders,
  getSslOptions,
  isSslConfigured
};
