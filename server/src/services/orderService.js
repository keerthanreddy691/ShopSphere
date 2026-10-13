import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { OrderItem } from '../models/OrderItem.js';
import { Payment } from '../models/Payment.js';
import { Delivery } from '../models/Delivery.js';
import { Return } from '../models/Return.js';
import { Review } from '../models/Review.js';
import { ApiError } from '../utils/ApiError.js';
import { assertTransition, nextStatusesFor } from '../utils/orderStateMachine.js';
import { paginated } from '../utils/pagination.js';
import * as inventory from './inventoryService.js';
import * as settlementService from './settlementService.js';
import { notify } from './notificationService.js';
import { paymentProvider } from './payment/index.js';

const MESSAGES = {
  CONFIRMED: ['Order confirmed', 'The seller has confirmed your order and is preparing it.'],
  PACKED: ['Order packed', 'Your order is packed and will be handed to our delivery partner soon.'],
  SHIPPED: ['Order shipped', 'Your order is on its way!'],
  DELIVERED: ['Order delivered', 'Your order has been delivered. Enjoy! You can now rate your purchase.'],
  CANCELLED: ['Order cancelled', 'Your order was cancelled. Any payment made will be refunded.'],
};

export const RETURN_WINDOW_DAYS = 7;

async function restoreStock(order, type, actorId) {
  const items = await OrderItem.find({ order: order._id }).lean();
  for (const it of items) {
    // eslint-disable-next-line no-await-in-loop
    await inventory.increment({ productId: it.product, variantId: it.variantId, quantity: it.quantity });
    // eslint-disable-next-line no-await-in-loop
    await inventory.log({ product: it.product, seller: order.seller, variantId: it.variantId, type, quantity: it.quantity, reason: `${type === 'CANCELLATION' ? 'Cancelled' : 'Returned'} order ${order.orderNumber}`, order: order._id, performedBy: actorId });
  }
}

/**
 * Single entry point for every order status change. Enforces the state machine and role
 * permissions, records history and applies side effects (stock, payments, delivery, settlements).
 */
export async function transition(order, to, actor, note = '') {
  const role = actor?.role || 'SYSTEM';
  assertTransition(order.status, to, role);
  order.status = to;
  order.statusHistory.push({ status: to, note, by: actor?._id, role });

  if (to === 'CANCELLED') {
    order.cancelReason = note;
    await restoreStock(order, 'CANCELLATION', actor?._id);
    const payment = await Payment.findById(order.payment);
    if (payment?.status === 'SUCCESS') {
      const r = await paymentProvider.refund({ transactionId: payment.transactionId, amount: payment.amount });
      Object.assign(payment, { status: 'REFUNDED', refundAmount: payment.amount, refundReference: r.refundReference, refundedAt: new Date() });
      order.paymentStatus = 'REFUNDED';
    } else if (payment?.status === 'PENDING') {
      payment.status = 'FAILED'; // COD order cancelled before any money changed hands
      order.paymentStatus = 'FAILED';
    }
    await payment?.save();
    await Delivery.updateOne({ order: order._id }, { status: 'CANCELLED', $push: { history: { status: 'CANCELLED', note: 'Order cancelled' } } });
    if (role === 'CUSTOMER') {
      await notify(order.seller, {
        type: 'ORDER_CANCELLED',
        title: `Order ${order.orderNumber} cancelled by customer`,
        message: note ? `Reason: ${note}` : 'The order was cancelled.',
        link: `/seller/orders/${order._id}`,
      });
    }
  }

  if (to === 'DELIVERED') {
    order.deliveredAt = new Date();
    if (order.paymentStatus === 'PENDING') {
      order.paymentStatus = 'SUCCESS'; // cash collected on delivery
      await Payment.updateOne({ _id: order.payment }, { status: 'SUCCESS' });
    }
  }

  await order.save();
  if (to === 'DELIVERED') {
    await settlementService.createForOrder(order);
    await notify(order.seller, { type: 'ORDER_DELIVERED', title: `Order ${order.orderNumber} delivered`, message: 'Settlement has been queued for payout.', link: `/seller/orders/${order._id}` });
  }
  // Tell the customer about every step they did not trigger themselves.
  if (MESSAGES[to] && role !== 'CUSTOMER') {
    await notify(order.customer, { type: `ORDER_${to}`, title: `${MESSAGES[to][0]} · ${order.orderNumber}`, message: MESSAGES[to][1], link: `/account/orders/${order._id}` });
  }
  return order;
}

async function hydrate(order, viewerRole) {
  const [items, payment, delivery, returns, reviews] = await Promise.all([
    OrderItem.find({ order: order._id }).lean(),
    Payment.findById(order.payment).lean(),
    Delivery.findById(order.delivery).populate('agent', 'name phone').lean(),
    Return.find({ order: order._id }).sort({ createdAt: -1 }).lean(),
    Review.find({ order: order._id }).select('orderItem rating').lean(),
  ]);
  const reviewed = new Map(reviews.map((r) => [r.orderItem.toString(), r.rating]));
  const deliveredAt = order.deliveredAt ? new Date(order.deliveredAt) : null;
  const returnDeadline = deliveredAt ? new Date(deliveredAt.getTime() + RETURN_WINDOW_DAYS * 86400000) : null;
  return {
    ...order,
    items: items.map((i) => ({ ...i, reviewRating: reviewed.get(i._id.toString()) || null })),
    payment,
    delivery,
    returns,
    returnDeadline,
    allowedActions: nextStatusesFor(order.status, viewerRole),
    canCancel: ['PLACED', 'CONFIRMED'].includes(order.status),
    canReturn: order.status === 'DELIVERED' && returnDeadline && returnDeadline > new Date() && !returns.some((r) => r.status !== 'REJECTED'),
  };
}

const populateOrder = (q) => q.populate('store', 'name slug logo').populate('customer', 'name email phone').populate('seller', 'name email');

// ----- Customer -----
export async function listForCustomer(customerId, { status }, pg) {
  const filter = { customer: customerId };
  if (status) filter.status = status;
  const [orders, total] = await Promise.all([
    Order.find(filter).populate('store', 'name slug logo').sort({ createdAt: -1 }).skip(pg.skip).limit(pg.limit).lean(),
    Order.countDocuments(filter),
  ]);
  const items = await OrderItem.find({ order: { $in: orders.map((o) => o._id) } }).select('order name image quantity variantLabel price product').lean();
  const byOrder = items.reduce((m, it) => m.set(it.order.toString(), [...(m.get(it.order.toString()) || []), it]), new Map());
  return paginated(orders.map((o) => ({ ...o, items: byOrder.get(o._id.toString()) || [] })), total, pg);
}

export async function getForCustomer(customerId, id) {
  const order = await populateOrder(Order.findOne({ _id: id, customer: customerId })).lean();
  if (!order) throw ApiError.notFound('Order not found');
  return hydrate(order, 'CUSTOMER');
}

export async function getCheckout(customerId, checkoutId) {
  const orders = await populateOrder(Order.find({ checkoutId, customer: customerId })).sort({ createdAt: 1 }).lean();
  if (!orders.length) throw ApiError.notFound('Checkout not found');
  const hydrated = await Promise.all(orders.map((o) => hydrate(o, 'CUSTOMER')));
  const sum = (k) => orders.reduce((s, o) => s + o[k], 0);
  return { checkoutId, createdAt: orders[0].createdAt, orders: hydrated, summary: { subtotal: sum('subtotal'), discount: sum('discount'), shipping: sum('shippingFee'), total: sum('total') }, shippingAddress: orders[0].shippingAddress, paymentMethod: orders[0].paymentMethod };
}

export async function cancelByCustomer(customer, id, reason) {
  const order = await Order.findOne({ _id: id, customer: customer._id });
  if (!order) throw ApiError.notFound('Order not found');
  if (!['PLACED', 'CONFIRMED'].includes(order.status)) throw ApiError.badRequest('This order can no longer be cancelled because it has already been packed or shipped');
  return transition(order, 'CANCELLED', customer, reason || 'Cancelled by customer');
}

// ----- Seller / Admin -----
export async function listForStaff({ seller, status, q, from, to }, pg) {
  const filter = {};
  if (seller) filter.seller = seller;
  if (status) filter.status = { $in: status.split(',') };
  if (q) filter.$or = [{ orderNumber: new RegExp(q, 'i') }, { checkoutId: new RegExp(q, 'i') }, { 'shippingAddress.fullName': new RegExp(q, 'i') }];
  if (from || to) filter.createdAt = { ...(from ? { $gte: new Date(from) } : {}), ...(to ? { $lte: new Date(to) } : {}) };
  const [orders, total, counts] = await Promise.all([
    Order.find(filter).populate('customer', 'name email').populate('store', 'name slug').sort({ createdAt: -1 }).skip(pg.skip).limit(pg.limit).lean(),
    Order.countDocuments(filter),
    Order.aggregate([{ $match: seller ? { seller: new mongoose.Types.ObjectId(String(seller)) } : {} }, { $group: { _id: '$status', n: { $sum: 1 } } }]),
  ]);
  return { ...paginated(orders, total, pg), counts: Object.fromEntries(counts.map((c) => [c._id, c.n])) };
}

export async function getForStaff(user, id) {
  const filter = { _id: id };
  if (user.role === 'SELLER') filter.seller = user._id;
  const order = await populateOrder(Order.findOne(filter)).lean();
  if (!order) throw ApiError.notFound('Order not found');
  return hydrate(order, user.role);
}

export async function updateStatusByStaff(user, id, status, note) {
  const filter = { _id: id };
  if (user.role === 'SELLER') filter.seller = user._id;
  const order = await Order.findOne(filter);
  if (!order) throw ApiError.notFound('Order not found');
  if (status === 'DELIVERED' && user.role !== 'ADMIN') throw ApiError.forbidden('Delivery is confirmed by the delivery partner');
  if (['RETURNED', 'REFUNDED', 'RETURN_REQUESTED'].includes(status)) throw ApiError.badRequest('Use the returns workflow for return and refund updates');
  return transition(order, status, user, note);
}
