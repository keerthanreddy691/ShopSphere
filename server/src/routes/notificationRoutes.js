import { Router } from 'express';
import * as c from '../controllers/notificationController.js';
import { authenticate } from '../middleware/authenticate.js';

const r = Router();
r.use(authenticate);
r.get('/', c.list);
r.get('/unread-count', c.unread);
r.patch('/read-all', c.markAllRead);
r.patch('/:id/read', c.markRead);
export default r;
