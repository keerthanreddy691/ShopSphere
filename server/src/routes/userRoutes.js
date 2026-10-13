import { Router } from 'express';
import * as c from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { updateProfileSchema, changePasswordSchema, createStaffSchema } from '../validators/userValidators.js';

const r = Router();
r.use(authenticate);
r.patch('/profile', validate(updateProfileSchema), c.updateProfile);
r.patch('/password', validate(changePasswordSchema), c.changePassword);
r.get('/', authorize('ADMIN'), c.list);
r.post('/', authorize('ADMIN'), validate(createStaffSchema), c.createStaff);
r.patch('/:id/status', authorize('ADMIN'), c.setStatus);
export default r;
