const rateLimit = require('express-rate-limit');

// Strict limiter for auth endpoints
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many auth attempts. Try again in 15 minutes.' },
  standardHeaders: true,
});

// OTP limiter (prevent SMS spam)
exports.otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many OTP requests. Try again in 1 hour.' },
});

// Standard API limiter
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
});

// Panic button — no rate limit (safety critical)
exports.panicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
});
