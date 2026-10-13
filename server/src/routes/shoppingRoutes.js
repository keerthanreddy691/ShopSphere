import { Router } from 'express';
import * as c from '../controllers/shoppingController.js';
import * as o from '../controllers/orderController.js';
import { authenticate, authorize, requireApprovedSeller } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import * as v from '../validators/orderValidators.js';

const customer = [authenticate, authorize('CUSTOMER')];
const sellerCheck = (req, res, next) => (req.user.role === 'SELLER' ? requireApprovedSeller(req, res, next) : next());

export const cartRoutes = Router()
  .use(...customer)
  .get('/', c.getCart)
  .post('/items', validate(v.addToCartSchema), c.addToCart)
  .patch('/items/:itemId', validate(v.updateCartSchema), c.updateCartItem)
  .delete('/items/:itemId', c.removeCartItem);

export const wishlistRoutes = Router()
  .use(...customer)
  .get('/', c.getWishlist)
  .post('/:productId', c.addToWishlist)
  .post('/:productId/move-to-cart', c.moveToCart)
  .delete('/:productId', c.removeFromWishlist);

export const couponRoutes = Router()
  .get('/available', c.availableCoupons)
  .get('/', authenticate, authorize('ADMIN'), c.listCoupons)
  .post('/', authenticate, authorize('ADMIN'), validate(v.couponSchema), c.createCoupon)
  .patch('/:id', authenticate, authorize('ADMIN'), c.updateCoupon)
  .delete('/:id', authenticate, authorize('ADMIN'), c.deleteCoupon);

export const orderRoutes = Router()
  .post('/checkout/preview', ...customer, validate(v.previewSchema), c.previewCheckout)
  .post('/checkout', ...customer, validate(v.checkoutSchema), c.placeOrder)
  .get('/my', ...customer, o.myOrders)
  .get('/my/checkout/:checkoutId', ...customer, o.myCheckout)
  .get('/my/:id', ...customer, o.myOrder)
  .post('/my/:id/cancel', ...customer, validate(v.cancelSchema), o.cancelMyOrder)
  .get('/', authenticate, authorize('SELLER', 'ADMIN', 'SUPPORT'), sellerCheck, o.staffOrders)
  .get('/:id', authenticate, authorize('SELLER', 'ADMIN', 'SUPPORT'), sellerCheck, o.staffOrder)
  .patch('/:id/status', authenticate, authorize('SELLER', 'ADMIN'), sellerCheck, validate(v.statusSchema), o.staffUpdateStatus);

export const paymentRoutes = Router().get('/', authenticate, authorize('CUSTOMER', 'ADMIN'), o.payments);

export const deliveryRoutes = Router()
  .get('/assigned', authenticate, authorize('DELIVERY'), o.agentDeliveries)
  .get('/assigned/:id', authenticate, authorize('DELIVERY'), o.agentDelivery)
  .patch('/:id/status', authenticate, authorize('DELIVERY', 'ADMIN'), validate(v.deliveryStatusSchema), o.agentUpdate)
  .get('/', authenticate, authorize('ADMIN'), o.allDeliveries)
  .patch('/:id/assign', authenticate, authorize('ADMIN'), o.assignDelivery);

export const settlementRoutes = Router()
  .get('/', authenticate, authorize('SELLER', 'ADMIN'), sellerCheck, o.settlements)
  .patch('/:id/status', authenticate, authorize('ADMIN'), validate(v.settlementStatusSchema), o.updateSettlement);
