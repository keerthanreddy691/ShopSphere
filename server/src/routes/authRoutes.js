import { Router } from 'express';
import * as c from '../controllers/authController.js';
import { authenticate, optionalAuth } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { registerSchema, loginSchema } from '../validators/authValidators.js';

const r = Router();
r.post('/register', authLimiter, validate(registerSchema), c.register);
r.post('/login', authLimiter, validate(loginSchema), c.login);
r.post('/logout', c.logout);
r.get('/me', authenticate, c.me);
// Same as /me but returns { user: null } for guests instead of 401 (used on app start).
r.get('/session', optionalAuth, c.session);
export default r;
