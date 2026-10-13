import { Delivery } from '../models/Delivery.js';
import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { paginated } from '../utils/pagination.js';
import { transition } from './orderService.js';
import { notify } from './notificationService.js';

// Delivery partner state machine.
const FLOW = {
  ASSIGNED: ['PICKED_UP'],
  PICKED_UP: ['IN_TRANSIT'],
  IN_TRANSIT: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED'],
  FAILED: ['OUT_FOR_DELIVERY'],
};
export const nextDeliveryStatuses = (status) => FLOW[status] || [];

const withOrder = (q) =>
  q.populate({ path: 'order', select: 'orderNumber status total itemCount paymentMethod paymentStatus store createdAt', populate: { path: 'store', select: 'name city contactPhone' } })
    .populate('customer', 'name phone')
    .populate('seller', 'name');

export async function listForAgent(agentId, { status }, pg) {
  const filter = { agent: agentId };
  if (status === 'PENDING') filter.status = 'ASSIGNED';
  else if (status === 'ACTIVE') filter.status = { $in: ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] };
  else if (status) filter.status = status;
  const [items, total, counts] = await Promise.all([
    withOrder(Delivery.find(filter)).sort({ updatedAt: -1 }).skip(pg.skip).limit(pg.limit).lean(),
    Delivery.countDocuments(filter),
    Delivery.aggregate([{ $match: { agent: agentId } }, { $group: { _id: '$status', n: { $sum: 1 } } }]),
  ]);
  return {
    ...paginated(items.map((d) => ({ ...d, nextStatuses: d.order?.status === 'SHIPPED' || d.status !== 'ASSIGNED' ? nextDeliveryStatuses(d.status) : [], readyForPickup: d.order?.status === 'SHIPPED' })), total, pg),
    counts: Object.fromEntries(counts.map((c) => [c._id, c.n])),
  };
}

export async function getForAgent(agentId, id) {
  const d = await withOrder(Delivery.findOne({ _id: id, agent: agentId })).lean();
  if (!d) throw ApiError.notFound('Delivery not found');
  return { ...d, nextStatuses: d.order?.status === 'SHIPPED' || d.status !== 'ASSIGNED' ? nextDeliveryStatuses(d.status) : [] };
}

export async function updateByAgent(agent, id, status, note = '') {
  const filter = { _id: id };
  if (agent.role === 'DELIVERY') filter.agent = agent._id; // partners can only touch their own assignments
  const delivery = await Delivery.findOne(filter);
  if (!delivery) throw ApiError.notFound('Delivery not found');
  if (!nextDeliveryStatuses(delivery.status).includes(status)) throw ApiError.badRequest(`Invalid delivery update: ${delivery.status} → ${status}`);
  const order = await Order.findById(delivery.order);
  if (delivery.status === 'ASSIGNED' && order.status !== 'SHIPPED') throw ApiError.badRequest('The seller has not shipped this order yet');

  delivery.status = status;
  delivery.history.push({ status, note });
  if (status === 'FAILED') delivery.failureReason = note || 'Customer unavailable';
  if (status === 'DELIVERED') delivery.deliveredAt = new Date();
  await delivery.save();

  if (status === 'DELIVERED') {
    await transition(order, 'DELIVERED', agent, note || 'Delivered by delivery partner');
  } else if (status === 'OUT_FOR_DELIVERY') {
    await notify(order.customer, { type: 'DELIVERY_UPDATE', title: `Out for delivery · ${order.orderNumber}`, message: 'Your package will reach you today.', link: `/account/orders/${order._id}` });
  } else if (status === 'FAILED') {
    await notify(order.customer, { type: 'DELIVERY_UPDATE', title: `Delivery attempt failed · ${order.orderNumber}`, message: `${delivery.failureReason}. We will try again.`, link: `/account/orders/${order._id}` });
  }
  return delivery;
}

// ----- Admin -----
export async function listAll({ status, agent }, pg) {
  const filter = {};
  if (status) filter.status = status;
  if (agent) filter.agent = agent;
  const [items, total] = await Promise.all([
    withOrder(Delivery.find(filter)).populate('agent', 'name').sort({ updatedAt: -1 }).skip(pg.skip).limit(pg.limit).lean(),
    Delivery.countDocuments(filter),
  ]);
  return paginated(items, total, pg);
}

export async function assign(id, agentId) {
  const agent = await User.findOne({ _id: agentId, role: 'DELIVERY', isActive: true });
  if (!agent) throw ApiError.badRequest('Delivery partner not found');
  const delivery = await Delivery.findById(id);
  if (!delivery) throw ApiError.notFound('Delivery not found');
  if (['DELIVERED', 'CANCELLED'].includes(delivery.status)) throw ApiError.badRequest('This delivery is already closed');
  delivery.agent = agent._id;
  if (delivery.status === 'AWAITING_DISPATCH') delivery.status = 'ASSIGNED';
  delivery.history.push({ status: delivery.status, note: `Assigned to ${agent.name}` });
  await delivery.save();
  await notify(agent._id, { type: 'DELIVERY_ASSIGNED', title: 'New delivery assigned', message: `Tracking ${delivery.trackingNumber}`, link: '/delivery' });
  return delivery;
}
