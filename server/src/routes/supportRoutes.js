import { Router } from 'express';
import * as c from '../controllers/supportController.js';
import { authenticate, authorize } from '../middleware/authenticate.js';

const router = Router();

// Customer
router.post('/tickets', authenticate, authorize('CUSTOMER'), c.createTicket);
router.get('/tickets/my', authenticate, authorize('CUSTOMER'), c.myTickets);
router.get('/tickets/my/:id', authenticate, authorize('CUSTOMER'), c.myTicket);
router.post('/tickets/my/:id/messages', authenticate, authorize('CUSTOMER'), c.customerReply);

// Staff (Support & Admin)
router.get('/tickets', authenticate, authorize('SUPPORT', 'ADMIN'), c.staffList);
router.get('/tickets/:id', authenticate, authorize('SUPPORT', 'ADMIN'), c.staffTicket);
router.patch('/tickets/:id/assign', authenticate, authorize('SUPPORT', 'ADMIN'), c.assign);
router.patch('/tickets/:id/status', authenticate, authorize('SUPPORT', 'ADMIN'), c.updateStatus);
router.post('/tickets/:id/messages', authenticate, authorize('SUPPORT', 'ADMIN'), c.staffReply);

export default router;

