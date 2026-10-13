import rateLimit from 'express-rate-limit';

const json = (message) => ({ success: false, message, errors: [] });

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: json('Too many authentication attempts. Please try again later.'),
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 600,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: json('Too many requests. Please slow down.'),
});
