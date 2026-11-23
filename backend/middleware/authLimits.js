const { createRateLimiter } = require('./rateLimit');

// Slows down password guessing and account spam. Per client IP.
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 wrong passwords, then wait
  countOnly: 'failures',
  message: 'Too many failed logins. Please try again in a few minutes.',
});

const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 30, // 30 sign-up attempts per hour
  message: 'Too many sign-up attempts. Please try again later.',
});

module.exports = { loginLimiter, registerLimiter };