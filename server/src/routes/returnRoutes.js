import { Router } from 'express';
import * as c from '../controllers/returnController.js';
import { authenticate, authorize, requireApprovedSeller } from '../middleware/authenticate.js';

const router = Router();

const sellerCheck = (req, res, next) => (req.user.role === 'SELLER' ? requireApprovedSeller(req, res, next) : next());

// Customer
router.post('/', authenticate, authorize('CUSTOMER'), c.createReturn);
router.get('/my', authenticate, authorize('CUSTOMER'), c.myReturns);

// Staff (Seller, Admin, Support)
router.get('/', authenticate, authorize('SELLER', 'ADMIN', 'SUPPORT'), sellerCheck, c.staffList);
router.get('/:id', authenticate, authorize('CUSTOMER', 'SELLER', 'ADMIN', 'SUPPORT'), c.getReturn);
router.patch('/:id/status', authenticate, authorize('SELLER', 'ADMIN', 'SUPPORT'), sellerCheck, c.updateStatus);

export default router;

