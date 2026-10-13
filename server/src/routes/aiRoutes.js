import { Router } from 'express';
import * as c from '../controllers/aiController.js';
import { authenticate, authorize, optionalAuth, requireApprovedSeller } from '../middleware/authenticate.js';

const router = Router();

// Seller: generate AI product description
router.post(
  '/generate-description',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  (req, res, next) => (req.user.role === 'SELLER' ? requireApprovedSeller(req, res, next) : next()),
  c.generateDescription,
);

// Public / Customer: similar products and smart recommendations
router.get('/similar/:productId', optionalAuth, c.similar);
router.get('/recommendations', optionalAuth, c.recommendations);
router.get('/smart-search', c.smartSearch);

export default router;

