import mongoose from 'mongoose';
import { Seller } from '../models/Seller.js';
import { Store } from '../models/Store.js';
import { User } from '../models/User.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Return } from '../models/Return.js';
import { Settlement } from '../models/Settlement.js';
import { ApiError } from '../utils/ApiError.js';
import { paginated } from '../utils/pagination.js';
import { notify } from './notificationService.js';

export async function getMine(userId) {
  const seller = await Seller.findOne({ user: userId }).lean();
  if (!seller) throw ApiError.notFound('Seller profile not found');
  const store = await Store.findOne({ seller: userId }).lean();
  return { ...seller, store };
}

export async function updateMine(userId, data) {
  const seller = await Seller.findOne({ user: userId });
  if (!seller) throw ApiError.notFound('Seller profile not found');
  Object.assign(seller, data);
  // A rejected applicant who updates details is re-queued for review.
  if (seller.status === 'REJECTED') {
    seller.status = 'PENDING';
    seller.rejectionReason = '';
  }
  await seller.save();
  return seller;
}

export async function list({ status, search }, pg) {
  const filter = {};
  if (status) filter.status = status;
  if (search) filter.businessName = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const [items, total] = await Promise.all([
    Seller.find(filter).populate('user', 'name email phone isActive createdAt').sort({ createdAt: -1 }).skip(pg.skip).limit(pg.limit).lean(),
    Seller.countDocuments(filter),
  ]);
  const stores = await Store.find({ seller: { $in: items.map((s) => s.user?._id) } }).select('seller name slug status rating').lean();
  const map = new Map(stores.map((s) => [s.seller.toString(), s]));
  return paginated(items.map((s) => ({ ...s, store: map.get(s.user?._id?.toString()) || null })), total, pg);
}

export async function review(adminId, sellerId, { status, reason }) {
  const seller = await Seller.findById(sellerId);
  if (!seller) throw ApiError.notFound('Seller not found');
  seller.status = status;
  seller.rejectionReason = status === 'APPROVED' ? '' : reason;
  seller.reviewedBy = adminId;
  seller.reviewedAt = new Date();
  await seller.save();

  // Suspending a seller hides their storefront; re-approving restores it.
  await Store.updateOne({ seller: seller.user }, { status: status === 'APPROVED' ? 'ACTIVE' : 'INACTIVE' });
  const user = await User.findById(seller.user);
  const messages = {
    APPROVED: ['Seller application approved', 'Congratulations! You can now set up your store and start listing products.'],
    REJECTED: ['Seller application rejected', reason || 'Your application did not meet our requirements.'],
    SUSPENDED: ['Seller account suspended', reason || 'Your seller account has been suspended. Contact support.'],
  };
  await notify(user._id, { type: 'SELLER_STATUS', title: messages[status][0], message: messages[status][1], link: '/seller' });
  return seller;
}

export async function getOverview(sellerId) {
  const sellerObjectId = new mongoose.Types.ObjectId(String(sellerId));

  const [ordersSummary, orderCounts, productsCount, lowStockCount, pendingReturns, pendingSettlements, recentOrders, dailyStats] = await Promise.all([
    Order.aggregate([
      { $match: { seller: sellerObjectId, status: { $ne: 'CANCELLED' } } },
      { $group: { _id: null, totalSales: { $sum: '$total' }, earnings: { $sum: '$sellerEarning' }, count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { seller: sellerObjectId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Product.countDocuments({ seller: sellerObjectId }),
    Product.countDocuments({ seller: sellerObjectId, $expr: { $lte: ['$stock', '$lowStockThreshold'] } }),
    Return.countDocuments({ seller: sellerObjectId, status: 'REQUESTED' }),
    Settlement.aggregate([
      { $match: { seller: sellerObjectId, status: 'PENDING' } },
      { $group: { _id: null, amount: { $sum: '$netAmount' } } },
    ]),
    Order.find({ seller: sellerObjectId })
      .populate('customer', 'name email')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),
    Order.aggregate([
      {
        $match: {
          seller: sellerObjectId,
          status: { $ne: 'CANCELLED' },
          createdAt: { $gte: new Date(Date.now() - 14 * 86400000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sales: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const counts = Object.fromEntries(orderCounts.map((c) => [c._id, c.count]));

  const trendMap = new Map(dailyStats.map((d) => [d._id, d]));
  const trend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    const item = trendMap.get(key) || { sales: 0, orders: 0 };
    trend.push({
      date: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      sales: item.sales,
      orders: item.orders,
    });
  }

  return {
    revenue: ordersSummary[0]?.earnings || ordersSummary[0]?.totalSales || 0,
    grossSales: ordersSummary[0]?.totalSales || 0,
    orders: ordersSummary[0]?.count || 0,
    orderCounts: counts,
    products: productsCount,
    lowStock: lowStockCount,
    pendingReturns,
    settlementAmount: pendingSettlements[0]?.amount || 0,
    recentOrders,
    salesTrend: trend,
  };
}
