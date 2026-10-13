import mongoose from 'mongoose';
import { Settlement } from '../models/Settlement.js';
import { Order } from '../models/Order.js';
import { env } from '../config/env.js';
import { round2 } from '../utils/money.js';
import { ApiError } from '../utils/ApiError.js';
import { paginated } from '../utils/pagination.js';

// Created when an order is delivered: seller receives the order total minus the platform fee.
export async function createForOrder(order) {
  const pct = env.platformFeePercent;
  const platformFee = round2((order.total * pct) / 100);
  const netAmount = round2(order.total - platformFee);
  await Order.updateOne({ _id: order._id }, { platformFee, sellerEarning: netAmount });
  return Settlement.findOneAndUpdate(
    { order: order._id },
    { $setOnInsert: { seller: order.seller, order: order._id, grossAmount: order.total, platformFeePercent: pct, platformFee, netAmount, status: 'PENDING', date: new Date() } },
    { upsert: true, new: true },
  );
}

// A refund reduces what the seller is owed. Full refunds reverse the settlement entirely.
export async function applyRefund(orderId, refundAmount) {
  const s = await Settlement.findOne({ order: orderId });
  if (!s) return null;
  const remaining = round2(Math.max(0, s.grossAmount - refundAmount));
  s.refundAdjustment = round2(refundAmount);
  s.platformFee = round2((remaining * s.platformFeePercent) / 100);
  s.netAmount = round2(remaining - s.platformFee);
  if (remaining === 0) s.status = 'REVERSED';
  s.note = `Refund of ₹${refundAmount.toLocaleString('en-IN')} adjusted`;
  await s.save();
  await Order.updateOne({ _id: orderId }, { platformFee: s.platformFee, sellerEarning: s.netAmount });
  return s;
}

export async function list({ seller, status }, pg) {
  const filter = {};
  if (seller) filter.seller = seller;
  if (status) filter.status = status;
  const [items, total, totals] = await Promise.all([
    Settlement.find(filter).populate('order', 'orderNumber total status createdAt').populate('seller', 'name email').sort({ date: -1 }).skip(pg.skip).limit(pg.limit).lean(),
    Settlement.countDocuments(filter),
    Settlement.aggregate([
      { $match: seller ? { seller: new mongoose.Types.ObjectId(String(seller)) } : {} },
      { $group: { _id: '$status', gross: { $sum: '$grossAmount' }, fee: { $sum: '$platformFee' }, net: { $sum: '$netAmount' }, count: { $sum: 1 } } },
    ]),
  ]);
  const summary = { PENDING: 0, PROCESSED: 0, ON_HOLD: 0, REVERSED: 0, totalFees: 0, totalGross: 0 };
  totals.forEach((t) => {
    summary[t._id] = round2(t.net);
    summary.totalFees = round2(summary.totalFees + t.fee);
    summary.totalGross = round2(summary.totalGross + t.gross);
  });
  return { ...paginated(items, total, pg), summary };
}

export async function updateStatus(id, status, note = '') {
  const s = await Settlement.findById(id);
  if (!s) throw ApiError.notFound('Settlement not found');
  if (s.status === 'REVERSED') throw ApiError.badRequest('Reversed settlements cannot be changed');
  s.status = status;
  if (note) s.note = note;
  if (status === 'PROCESSED') s.processedAt = new Date();
  await s.save();
  return s;
}
