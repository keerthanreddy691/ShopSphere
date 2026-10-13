import { Router } from 'express';
import * as c from '../controllers/reviewController.js';
import { authenticate, authorize } from '../middleware/authenticate.js';

const router = Router();

// Public: reviews for a product
router.get('/product/:productId', c.productReviews);

// Customer: submit review for a purchased product
router.post('/', authenticate, authorize('CUSTOMER'), c.createReview);

// Admin: moderation
router.get('/', authenticate, authorize('ADMIN'), c.listAll);
router.patch('/:id/status', authenticate, authorize('ADMIN'), c.updateStatus);

export default router;

