import { Router } from 'express';
import * as c from '../controllers/catalogController.js';
import { authenticate, authorize, optionalAuth, requireApprovedSeller } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import * as v from '../validators/catalogValidators.js';

export const categoryRoutes = Router()
  .get('/', optionalAuth, c.listCategories)
  .get('/:slug', c.getCategory)
  .post('/', authenticate, authorize('ADMIN'), validate(v.categorySchema), c.createCategory)
  .patch('/:id', authenticate, authorize('ADMIN'), validate(v.categorySchema.partial()), c.updateCategory)
  .patch('/:id/status', authenticate, authorize('ADMIN'), c.toggleCategory)
  .delete('/:id', authenticate, authorize('ADMIN'), c.deleteCategory);

const seller = [authenticate, authorize('SELLER'), requireApprovedSeller];
export const productRoutes = Router()
  .get('/', c.listProducts)
  .get('/brands', c.listBrands)
  .get('/seller/mine', ...seller, c.listMyProducts)
  .get('/seller/mine/:id', ...seller, c.getMyProduct)
  .post('/', ...seller, validate(v.productSchema), c.createProduct)
  .patch('/:id', ...seller, validate(v.productUpdateSchema), c.updateProduct)
  .delete('/:id', ...seller, c.deleteProduct)
  .get('/:slug', optionalAuth, c.getProduct);

export const storeRoutes = Router()
  .get('/', c.listStores)
  .get('/me/store', authenticate, authorize('SELLER'), c.getMyStore)
  .put('/me/store', ...seller, validate(v.storeSchema), c.saveMyStore)
  .get('/:slug', c.getStore);

export const sellerRoutes = Router()
  .get('/me/overview', authenticate, authorize('SELLER'), c.getMyOverview)
  .get('/me', authenticate, authorize('SELLER'), c.getMySellerProfile)
  .patch('/me', authenticate, authorize('SELLER'), validate(v.sellerProfileSchema), c.updateMySellerProfile)
  .get('/', authenticate, authorize('ADMIN'), c.listSellers)
  .patch('/:id/review', authenticate, authorize('ADMIN'), validate(v.sellerReviewSchema), c.reviewSeller);

export const inventoryRoutes = Router()
  .use(...seller)
  .get('/', c.listInventory)
  .patch('/:productId', validate(v.stockUpdateSchema), c.updateInventory)
  .get('/:productId/history', c.inventoryHistory);
