import crypto from 'node:crypto';
import { Order } from '../models/Order.js';
import { OrderItem } from '../models/OrderItem.js';
import { Payment } from '../models/Payment.js';
import { Delivery } from '../models/Delivery.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { round2 } from '../utils/money.js';
import * as cartService from './cartService.js';
import * as couponService from './couponService.js';
import * as inventory from './inventoryService.js';
import { notify } from './notificationService.js';
import { paymentProvider } from './payment/index.js';

const code = (n = 6) => crypto.randomBytes(8).toString('base64').replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, n);
const stamp = () => new Date().toISOString().slice(2, 10).replace(/-/g, '');
export const newCheckoutId = () => `CHK-${stamp()}-${code(6)}`;
export const newOrderNumber = () => `SS-${stamp()}-${code(6)}`;
export const newTracking = () => `SSX${Date.now().toString().slice(-8)}${code(3)}`;

/** Splits a total discount across seller groups proportionally to their subtotals. */
export function apportion(total, groups) {
  const sum = groups.reduce((s, g) => s + g.subtotal, 0);
  let remaining = total;
  return groups.map((g, i) => {
    if (i === groups.length - 1) return round2(remaining);
    const share = round2(sum ? (total * g.subtotal) / sum : 0);
    remaining = round2(remaining - share);
    return share;
  });
}

/** Picks the active delivery partner with the fewest open deliveries. */
async function pickDeliveryAgent() {
  const agents = await User.find({ role: 'DELIVERY', isActive: true }).select('_id').lean();
  if (!agents.length) return null;
  const loads = await Delivery.aggregate([
    { $match: { agent: { $in: agents.map((a) => a._id) }, status: { $nin: ['DELIVERED', 'FAILED', 'CANCELLED'] } } },
    { $group: { _id: '$agent', n: { $sum: 1 } } },
  ]);
  const map = new Map(loads.map((l) => [l._id.toString(), l.n]));
  return agents.sort((a, b) => (map.get(a._id.toString()) || 0) - (map.get(b._id.toString()) || 0))[0]._id;
}

/** Pricing preview used by the checkout page (same maths as placeOrder). */
export async function preview(userId, couponCode) {
  const cart = await cartService.buildCart(userId);
  let discount = 0;
  let coupon = null;
  let couponError = '';
  if (couponCode) {
    try {
      const res = await couponService.evaluate(couponCode, userId, cart.summary.subtotal);
      discount = res.discount;
      coupon = { code: res.coupon.code, description: res.coupon.description };
    } catch (e) {
      couponError = e.message;
    }
  }
  const shares = apportion(discount, cart.groups);
  const groups = cart.groups.map((g, i) => ({ ...g, discount: shares[i], total: round2(g.subtotal - shares[i] + g.shippingFee) }));
  return {
    ...cart,
    groups,
    coupon,
    couponError,
    summary: { ...cart.summary, couponDiscount: discount, total: round2(cart.summary.subtotal - discount + cart.summary.shipping) },
  };
}

/**
 * Multi-vendor checkout:
 * cart → validate products & stock → group by seller → apply coupon → reserve stock atomically
 * → charge payment → create one Order per seller sharing a checkoutId → payments → deliveries.
 */
export async function placeOrder(user, { shippingAddress, couponCode, paymentMethod = 'CARD', simulateFailure = false }) {
  const cart = await cartService.buildCart(user._id);
  if (!cart.items.length) throw ApiError.badRequest('Your cart is empty');
  const problems = cart.items.filter((i) => !i.available);
  if (problems.length) {
    throw new ApiError(409, 'Some items in your cart are unavailable. Please review your cart.', problems.map((p) => ({ field: p.product.name, message: p.issue })));
  }

  // Coupon (validated server-side against the server-computed subtotal)
  let discount = 0;
  let coupon = null;
  if (couponCode) {
    const res = await couponService.evaluate(couponCode, user._id, cart.summary.subtotal);
    discount = res.discount;
    coupon = res.coupon;
  }
  const shares = apportion(discount, cart.groups);

  // Reserve stock atomically; roll back everything reserved so far if any line fails.
  const reserved = [];
  for (const item of cart.items) {
    // eslint-disable-next-line no-await-in-loop
    const ok = await inventory.decrement({ productId: item.product._id, variantId: item.variantId, quantity: item.quantity });
    if (!ok) {
      await Promise.all(reserved.map((r) => inventory.increment(r)));
      throw new ApiError(409, `"${item.product.name}" just went out of stock. Please update your cart.`);
    }
    reserved.push({ productId: item.product._id, variantId: item.variantId, quantity: item.quantity });
  }

  const grandTotal = round2(cart.summary.subtotal - discount + cart.summary.shipping);
  const charge = await paymentProvider.charge({ amount: grandTotal, method: paymentMethod, simulateFailure });
  if (!charge.success) {
    await Promise.all(reserved.map((r) => inventory.increment(r)));
    throw new ApiError(402, charge.failureReason || 'Payment failed. You have not been charged.');
  }

  const checkoutId = newCheckoutId();
  const paymentStatus = charge.pending ? 'PENDING' : 'SUCCESS';
  const agent = await pickDeliveryAgent();
  const orders = [];

  for (const [i, group] of cart.groups.entries()) {
    const orderDiscount = shares[i];
    const total = round2(group.subtotal - orderDiscount + group.shippingFee);
    // eslint-disable-next-line no-await-in-loop
    const order = await Order.create({
      orderNumber: newOrderNumber(),
      checkoutId,
      customer: user._id,
      seller: group.seller._id,
      store: group.store?._id,
      itemCount: group.items.reduce((s, it) => s + it.quantity, 0),
      subtotal: group.subtotal,
      discount: orderDiscount,
      shippingFee: group.shippingFee,
      total,
      couponCode: coupon?.code || '',
      shippingAddress,
      status: 'PLACED',
      statusHistory: [{ status: 'PLACED', note: 'Order placed', by: user._id, role: 'CUSTOMER' }],
      paymentStatus,
      paymentMethod,
    });
    const items = await OrderItem.insertMany(
      group.items.map((it) => ({
        order: order._id,
        product: it.product._id,
        seller: group.seller._id,
        customer: user._id,
        name: it.product.name,
        image: it.product.image,
        sku: it.sku,
        variantId: it.variantId,
        variantLabel: it.variantLabel,
        mrp: it.mrp,
        price: it.price,
        quantity: it.quantity,
        lineTotal: it.lineTotal,
      })),
    );
    const payment = await Payment.create({
      checkoutId,
      order: order._id,
      customer: user._id,
      amount: total,
      method: paymentMethod,
      provider: paymentProvider.name,
      transactionId: charge.transactionId,
      status: paymentStatus,
    });
    const delivery = await Delivery.create({
      order: order._id,
      trackingNumber: newTracking(),
      agent,
      customer: user._id,
      seller: group.seller._id,
      dropAddress: shippingAddress,
      status: agent ? 'ASSIGNED' : 'AWAITING_DISPATCH',
      history: [{ status: agent ? 'ASSIGNED' : 'AWAITING_DISPATCH', note: 'Delivery created at checkout' }],
      estimatedDelivery: new Date(Date.now() + 5 * 86400000),
    });
    order.items = items.map((x) => x._id);
    order.payment = payment._id;
    order.delivery = delivery._id;
    await order.save();

    await Promise.all(
      group.items.map((it) =>
        inventory.log({ product: it.product._id, seller: group.seller._id, variantId: it.variantId, type: 'SALE', quantity: -it.quantity, reason: `Order ${order.orderNumber}`, order: order._id, performedBy: user._id }),
      ),
    );
    await notify(group.seller._id, {
      type: 'NEW_ORDER',
      title: `New order ${order.orderNumber}`,
      message: `${order.itemCount} item(s) worth ₹${total.toLocaleString('en-IN')} — please confirm it.`,
      link: `/seller/orders/${order._id}`,
    });
    orders.push(order);
  }

  await cartService.clear(user._id);
  if (coupon) await couponService.recordUsage(coupon._id, user._id);
  await notify(user._id, {
    type: 'ORDER_PLACED',
    title: 'Order placed successfully',
    message: `Your checkout ${checkoutId} was split into ${orders.length} order(s) from ${orders.length} seller(s).`,
    link: `/account/orders/checkout/${checkoutId}`,
  });

  return { checkoutId, orders: orders.map((o) => ({ _id: o._id, orderNumber: o.orderNumber, total: o.total, seller: o.seller })), total: grandTotal, discount, paymentStatus, transactionId: charge.transactionId };
}
