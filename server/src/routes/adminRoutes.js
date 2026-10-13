import { Router } from 'express';
import * as catalog from '../controllers/catalogController.js';
import * as auditCtrl from '../controllers/auditController.js';
import * as adminCtrl from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { moderationSchema } from '../validators/catalogValidators.js';

const r = Router();
r.use(authenticate, authorize('ADMIN'));
r.get('/overview', adminCtrl.overview);
r.get('/products', catalog.adminListProducts);
r.patch('/products/:id/moderate', validate(moderationSchema), catalog.moderateProduct);
r.patch('/products/:id/feature', catalog.featureProduct);
r.get('/audit-logs', auditCtrl.list);
export default r;
