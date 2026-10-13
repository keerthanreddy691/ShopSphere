import * as cartService from '../services/cartService.js';
import * as wishlistService from '../services/wishlistService.js';
import * as couponService from '../services/couponService.js';
import * as checkoutService from '../services/checkoutService.js';
import { audit } from '../services/auditService.js';
import { ok, created } from '../utils/response.js';

// Cart
export const getCart = async (req, res) => ok(res, await cartService.buildCart(req.user._id));
export async function addToCart(req, res) {
  const { capped, cart } = await cartService.addItem(req.user._id, req.body);
  return ok(res, cart, capped ? 'Added — quantity limited by available stock' : 'Added to cart');
}
export const updateCartItem = async (req, res) => ok(res, await cartService.updateItem(req.user._id, req.params.itemId, req.body.quantity), 'Cart updated');
export const removeCartItem = async (req, res) => ok(res, await cartService.removeItem(req.user._id, req.params.itemId), 'Removed from cart');

// Wishlist
export const getWishlist = async (req, res) => ok(res, { products: await wishlistService.get(req.user._id) });
export async function addToWishlist(req, res) {
  await wishlistService.add(req.user._id, req.params.productId);
  return ok(res, {}, 'Saved to wishlist');
}
export async function removeFromWishlist(req, res) {
  await wishlistService.remove(req.user._id, req.params.productId);
  return ok(res, {}, 'Removed from wishlist');
}
export async function moveToCart(req, res) {
  const { cart } = await cartService.addItem(req.user._id, { productId: req.params.productId, variantId: req.body.variantId, quantity: 1 });
  await wishlistService.remove(req.user._id, req.params.productId);
  return ok(res, cart, 'Moved to cart');
}

// Checkout
export const previewCheckout = async (req, res) => ok(res, await checkoutService.preview(req.user._id, req.body.couponCode));
export async function placeOrder(req, res) {
  const { saveAddress, ...body } = req.body;
  const result = await checkoutService.placeOrder(req.user, body);
  if (saveAddress) {
    req.user.address = body.shippingAddress;
    await req.user.save();
  }
  return created(res, result, `Payment successful — ${result.orders.length} order(s) placed`);
}

// Coupons
export const availableCoupons = async (_req, res) => ok(res, { coupons: await couponService.listAvailable() });
export const listCoupons = async (_req, res) => ok(res, { coupons: await couponService.listAll() });
export async function createCoupon(req, res) {
  const coupon = await couponService.create(req.body);
  await audit(req, 'COUPON_CREATED', 'Coupon', coupon._id, { code: coupon.code });
  return created(res, { coupon }, 'Coupon created');
}
export async function updateCoupon(req, res) {
  const coupon = await couponService.update(req.params.id, req.body);
  await audit(req, 'COUPON_UPDATED', 'Coupon', coupon._id, { code: coupon.code, isActive: coupon.isActive });
  return ok(res, { coupon }, 'Coupon updated');
}
export async function deleteCoupon(req, res) {
  const coupon = await couponService.remove(req.params.id);
  await audit(req, 'COUPON_DELETED', 'Coupon', coupon._id, { code: coupon.code });
  return ok(res, {}, 'Coupon deleted');
}
