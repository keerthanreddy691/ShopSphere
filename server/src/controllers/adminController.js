import { User } from '../models/User.js';
import { Seller } from '../models/Seller.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { SupportTicket } from '../models/SupportTicket.js';
import { Return } from '../models/Return.js';
import { ok } from '../utils/response.js';

export async function overview(_req, res) {
  const [
    userRoles,
    sellerStatuses,
    ordersAgg,
    orderStatusCounts,
    productModCounts,
    ticketStatusCounts,
    returnCounts,
    recentOrders,
    dailyStats,
  ] = await Promise.all([
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    Seller.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { status: { $ne: 'CANCELLED' } } },
      { $group: { _id: null, gmv: { $sum: '$total' }, platformFee: { $sum: '$platformFee' }, count: { $sum: 1 } } },
    ]),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Product.aggregate([{ $group: { _id: '$moderationStatus', count: { $sum: 1 } } }]),
    SupportTicket.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Return.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.find()
      .populate('customer', 'name email')
      .populate('store', 'name')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
    Order.aggregate([
      {
        $match: {
          status: { $ne: 'CANCELLED' },
          createdAt: { $gte: new Date(Date.now() - 14 * 86400000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          gmv: { $sum: '$total' },
          revenue: { $sum: '$platformFee' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const userMap = Object.fromEntries(userRoles.map((u) => [u._id, u.count]));
  const sellerMap = Object.fromEntries(sellerStatuses.map((s) => [s._id, s.count]));
  const orderMap = Object.fromEntries(orderStatusCounts.map((o) => [o._id, o.count]));
  const prodModMap = Object.fromEntries(productModCounts.map((p) => [p._id, p.count]));
  const ticketMap = Object.fromEntries(ticketStatusCounts.map((t) => [t._id, t.count]));
  const returnMap = Object.fromEntries(returnCounts.map((r) => [r._id, r.count]));

  const totalUsers = Object.values(userMap).reduce((s, v) => s + v, 0);
  const totalSellers = Object.values(sellerMap).reduce((s, v) => s + v, 0);
  const totalOrders = Object.values(orderMap).reduce((s, v) => s + v, 0);

  const trendMap = new Map(dailyStats.map((d) => [d._id, d]));
  const salesTrend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    const item = trendMap.get(key) || { gmv: 0, revenue: 0, orders: 0 };
    salesTrend.push({
      date: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      gmv: item.gmv,
      revenue: item.revenue,
      orders: item.orders,
    });
  }

  return ok(res, {
    totalUsers,
    userRoles: userMap,
    totalSellers,
    sellerStatuses: sellerMap,
    totalOrders,
    orderStatuses: orderMap,
    gmv: ordersAgg[0]?.gmv || 0,
    platformRevenue: ordersAgg[0]?.platformFee || 0,
    pendingSellerApprovals: sellerMap.PENDING || 0,
    pendingProductModeration: prodModMap.PENDING || 0,
    openTickets: (ticketMap.OPEN || 0) + (ticketMap.IN_PROGRESS || 0),
    pendingReturns: returnMap.REQUESTED || 0,
    recentOrders,
    salesTrend,
  });
}

