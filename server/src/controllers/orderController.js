import * as orderService from '../services/orderService.js';
import * as deliveryService from '../services/deliveryService.js';
import * as settlementService from '../services/settlementService.js';
import { Payment } from '../models/Payment.js';
import { audit } from '../services/auditService.js';
import { ok } from '../utils/response.js';
import { getPagination, paginated } from '../utils/pagination.js';

// Customer
export const myOrders = async (req, res) => ok(res, await orderService.listForCustomer(req.user._id, req.query, getPagination(req.query, 10)));
export const myOrder = async (req, res) => ok(res, { order: await orderService.getForCustomer(req.user._id, req.params.id) });
export const myCheckout = async (req, res) => ok(res, await orderService.getCheckout(req.user._id, req.params.checkoutId));
export async function cancelMyOrder(req, res) {
  const order = await orderService.cancelByCustomer(req.user, req.params.id, req.body.reason);
  return ok(res, { order }, 'Order cancelled. Any payment will be refunded.');
}

// Seller, admin & support (sellers are scoped to their own orders in the service)
export async function staffOrders(req, res) {
  const query = { ...req.query };
  if (req.user.role === 'SELLER') query.seller = req.user._id;
  return ok(res, await orderService.listForStaff(query, getPagination(req.query, 15)));
}
export const staffOrder = async (req, res) => ok(res, { order: await orderService.getForStaff(req.user, req.params.id) });
export async function staffUpdateStatus(req, res) {
  const order = await orderService.updateStatusByStaff(req.user, req.params.id, req.body.status, req.body.note);
  if (req.user.role === 'ADMIN') await audit(req, `ORDER_${req.body.status}`, 'Order', order._id, { orderNumber: order.orderNumber });
  return ok(res, { order }, `Order marked ${req.body.status.toLowerCase()}`);
}

// Payments
export async function payments(req, res) {
  const pg = getPagination(req.query, 20);
  const filter = req.user.role === 'CUSTOMER' ? { customer: req.user._id } : {};
  if (req.query.status) filter.status = req.query.status;
  const [items, total] = await Promise.all([
    Payment.find(filter).populate('order', 'orderNumber status').populate('customer', 'name email').sort({ createdAt: -1 }).skip(pg.skip).limit(pg.limit).lean(),
    Payment.countDocuments(filter),
  ]);
  return ok(res, paginated(items, total, pg));
}

// Deliveries
export const agentDeliveries = async (req, res) => ok(res, await deliveryService.listForAgent(req.user._id, req.query, getPagination(req.query, 20)));
export const agentDelivery = async (req, res) => ok(res, { delivery: await deliveryService.getForAgent(req.user._id, req.params.id) });
export async function agentUpdate(req, res) {
  const delivery = await deliveryService.updateByAgent(req.user, req.params.id, req.body.status, req.body.note);
  return ok(res, { delivery }, `Delivery marked ${req.body.status.replace(/_/g, ' ').toLowerCase()}`);
}
export const allDeliveries = async (req, res) => ok(res, await deliveryService.listAll(req.query, getPagination(req.query, 20)));
export async function assignDelivery(req, res) {
  const delivery = await deliveryService.assign(req.params.id, req.body.agentId);
  await audit(req, 'DELIVERY_ASSIGNED', 'Delivery', delivery._id, { agent: req.body.agentId });
  return ok(res, { delivery }, 'Delivery partner assigned');
}

// Settlements
export async function settlements(req, res) {
  const query = { ...req.query };
  if (req.user.role === 'SELLER') query.seller = req.user._id;
  return ok(res, await settlementService.list(query, getPagination(req.query, 20)));
}
export async function updateSettlement(req, res) {
  const s = await settlementService.updateStatus(req.params.id, req.body.status, req.body.note);
  await audit(req, `SETTLEMENT_${req.body.status}`, 'Settlement', s._id, { netAmount: s.netAmount });
  return ok(res, { settlement: s }, 'Settlement updated');
}
