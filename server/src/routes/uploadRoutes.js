import { Router } from 'express';
import * as c from '../controllers/uploadController.js';
import { authenticate } from '../middleware/authenticate.js';

const r = Router();
r.post('/signature', authenticate, c.signature);
export default r;
