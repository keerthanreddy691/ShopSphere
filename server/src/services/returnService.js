import mongoose from 'mongoose';
import { Return } from '../models/Return.js';
import { Order } from '../models/Order.js';
import { OrderItem } from '../models/OrderItem.js';
import { Payment } from '../models/Payment.js';
import { ApiError } from '../utils/ApiError.js';
import { paginated } from '../utils/pagination.js';
import * as inventory from './inventoryService.js';
import * as settlementService from './settlementService.js';
import { notify } from './notificationService.js';
import { paymentProvider } from './payment/index.js';

export const RETURN_WINDOW_DAYS = 7;

export async function createReturn(customer, { orderId, reason, description, images, items: requestedItems }) {
  const order = await Order.findOne({ _id: orderId, customer: customer._id });
  if (!order) throw ApiError.notFound('Order not found');

  if (order.status !== 'DELIVERED') {
    throw ApiError.badRequest('Only delivered orders are eligible for return');
  }

  const deliveredAt = order.deliveredAt ? new Date(order.deliveredAt) : new Date(order.createdAt);
  const deadline = new Date(deliveredAt.getTime() + RETURN_WINDOW_DAYS * 86400000);
  if (deadline < new Date()) {
    throw ApiError.badRequest('The 7-day return window for this order has expired');
  }

  const existingReturn = await Return.findOne({ order: order._id, status: { $ne: 'REJECTED' } });
  if (existingReturn) {
    throw ApiError.badRequest('A return request for this order is already pending or resolved');
  }

  const orderItems = await OrderItem.find({ order: order._id }).lean();
  if (!orderItems.length) throw ApiError.badRequest('No items found in order');

  let returnItems = [];
  let refundAmount = 0;

  if (requestedItems?.length) {
    for (const reqItem of requestedItems) {
      const match = orderItems.find((oi) => oi._id.toString() === reqItem.orderItemId || oi.product.toString() === reqItem.productId);
      if (match) {
        const qty = Math.min(match.quantity, reqItem.quantity || match.quantity);
        const itemAmount = (match.price * qty);
        refundAmount += itemAmount;
        returnItems.push({
          orderItem: match._id,
          product: match.product,
          variantId: match.variantId,
          name: match.name,
          image: match.image,
          quantity: qty,
          amount: itemAmount,
        });
      }
    }
  }

  if (!returnItems.length) {
    returnItems = orderItems.map((oi) => ({
      orderItem: oi._id,
      product: oi.product,
      variantId: oi.variantId,
      name: oi.name,
      image: oi.image,
      quantity: oi.quantity,
      amount: oi.lineTotal,
    }));
    refundAmount = order.total;
  }

  const returnNumber = `RET-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

  const returnDoc = await Return.create({
    returnNumber,
    order: order._id,
    customer: customer._id,
    seller: order.seller,
    items: returnItems,
    reason,
    description: description || '',
    images: images || [],
    status: 'REQUESTED',
    refundAmount,
    history: [{ status: 'REQUESTED', note: reason, by: customer._id, role: 'CUSTOMER', at: new Date() }],
  });

  order.status = 'RETURN_REQUESTED';
  order.statusHistory.push({ status: 'RETURN_REQUESTED', note: `Return requested: ${reason}`, by: customer._id, role: 'CUSTOMER', at: new Date() });
  await order.save();

  await notify(order.seller, {
    type: 'RETURN_REQUESTED',
    title: `Return requested · Order ${order.orderNumber}`,
    message: `Customer requested return for ${order.orderNumber}: "${reason}"`,
    link: `/seller/returns`,
  });

  return returnDoc;
}

export async function listForCustomer(customerId, query, pg) {
  const filter = { customer: customerId };
  if (query.status) filter.status = query.status;

  const [items, total] = await Promise.all([
    Return.find(filter)
      .populate('order', 'orderNumber total status createdAt')
      .populate('seller', 'name email')
      .sort({ createdAt: -1 })
      .skip(pg.skip)
      .limit(pg.limit)
      .lean(),
    Return.countDocuments(filter),
  ]);

  return paginated(items, total, pg);
}

export async function listForStaff(user, query, pg) {
  const filter = {};
  if (user.role === 'SELLER') filter.seller = user._id;
  if (query.status) filter.status = query.status;
  if (query.seller && user.role !== 'SELLER') filter.seller = query.seller;

  const [items, total, counts] = await Promise.all([
    Return.find(filter)
      .populate('order', 'orderNumber total status createdAt shippingAddress')
      .populate('customer', 'name email phone')
      .populate('seller', 'name email')
      .sort({ createdAt: -1 })
      .skip(pg.skip)
      .limit(pg.limit)
      .lean(),
    Return.countDocuments(filter),
    Return.aggregate([
      { $match: user.role === 'SELLER' ? { seller: new mongoose.Types.ObjectId(String(user._id)) } : {} },
      { $group: { _id: '$status', n: { $sum: 1 } } },
    ]),
  ]);

  return {
    ...paginated(items, total, pg),
    counts: Object.fromEntries(counts.map((c) => [c._id, c.n])),
  };
}

export async function getById(user, id) {
  const returnDoc = await Return.findById(id)
    .populate('order', 'orderNumber total status createdAt paymentMethod shippingAddress items')
    .populate('customer', 'name email phone')
    .populate('seller', 'name email')
    .lean();

  if (!returnDoc) throw ApiError.notFound('Return request not found');

  if (user.role === 'CUSTOMER' && !returnDoc.customer._id.equals(user._id)) {
    throw ApiError.forbidden('You can only view your own return requests');
  }
  if (user.role === 'SELLER' && !returnDoc.seller._id.equals(user._id)) {
    throw ApiError.forbidden('You can only view returns for your store');
  }

  return returnDoc;
}

export async function updateStatus(user, id, { status, note, resolutionNote }) {
  const filter = { _id: id };
  if (user.role === 'SELLER') filter.seller = user._id;

  const returnDoc = await Return.findOne(filter);
  if (!returnDoc) throw ApiError.notFound('Return request not found');

  const validTransitions = {
    REQUESTED: ['APPROVED', 'REJECTED', 'REFUNDED'],
    APPROVED: ['RECEIVED', 'REJECTED', 'REFUNDED'],
    RECEIVED: ['REFUNDED'],
    REJECTED: [],
    REFUNDED: [],
  };

  const allowed = validTransitions[returnDoc.status] || [];
  if (!allowed.includes(status)) {
    throw ApiError.badRequest(`Invalid transition from ${returnDoc.status} to ${status}`);
  }

  returnDoc.status = status;
  if (resolutionNote) returnDoc.resolutionNote = resolutionNote;
  returnDoc.history.push({ status, note: note || resolutionNote || '', by: user._id, role: user.role, at: new Date() });

  const order = await Order.findById(returnDoc.order);

  if (status === 'REJECTED') {
    if (order && order.status === 'RETURN_REQUESTED') {
      order.status = 'DELIVERED';
      order.statusHistory.push({ status: 'DELIVERED', note: `Return rejected: ${note || resolutionNote || 'Not eligible'}`, by: user._id, role: user.role, at: new Date() });
      await order.save();
    }
    await notify(returnDoc.customer, {
      type: 'RETURN_UPDATE',
      title: `Return request rejected · ${returnDoc.returnNumber}`,
      message: resolutionNote || note || 'Your return request was not approved.',
      link: `/account/orders/${order?._id}`,
    });
  }

  if (status === 'APPROVED') {
    await notify(returnDoc.customer, {
      type: 'RETURN_UPDATE',
      title: `Return request approved · ${returnDoc.returnNumber}`,
      message: 'Your return has been approved. Please pack the item for pickup.',
      link: `/account/orders/${order?._id}`,
    });
  }

  if (status === 'REFUNDED') {
    // 1. Process payment refund if payment was settled
    if (order) {
      order.status = 'REFUNDED';
      order.paymentStatus = 'REFUNDED';
      order.statusHistory.push({ status: 'REFUNDED', note: `Refund processed: ₹${returnDoc.refundAmount}`, by: user._id, role: user.role, at: new Date() });
      await order.save();

      const payment = await Payment.findById(order.payment);
      if (payment && payment.status === 'SUCCESS') {
        const r = await paymentProvider.refund({ transactionId: payment.transactionId, amount: returnDoc.refundAmount });
        payment.status = 'REFUNDED';
        payment.refundAmount = returnDoc.refundAmount;
        payment.refundReference = r.refundReference;
        payment.refundedAt = new Date();
        await payment.save();
      }

      // 2. Adjust settlement
      await settlementService.applyRefund(order._id, returnDoc.refundAmount);

      // 3. Mark items returned and restore stock
      for (const item of returnDoc.items) {
        if (item.product) {
          await inventory.increment({ productId: item.product, variantId: item.variantId, quantity: item.quantity });
          await inventory.log({
            product: item.product,
            seller: returnDoc.seller,
            variantId: item.variantId,
            type: 'RETURN',
            quantity: item.quantity,
            reason: `Return refund ${returnDoc.returnNumber}`,
            order: order._id,
            performedBy: user._id,
          });
        }
        if (item.orderItem) {
          await OrderItem.updateOne({ _id: item.orderItem }, { returned: true });
        }
      }
    }

    await notify(returnDoc.customer, {
      type: 'REFUND_PROCESSED',
      title: `Refund issued · ₹${returnDoc.refundAmount}`,
      message: `Your return is complete and a refund of ₹${returnDoc.refundAmount.toLocaleString('en-IN')} has been issued.`,
      link: `/account/orders/${order?._id}`,
    });
  }

  await returnDoc.save();
  return returnDoc;
}

