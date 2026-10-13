import { Coupon } from '../models/Coupon.js';
import { ApiError } from '../utils/ApiError.js';
import { round2 } from '../utils/money.js';

/** Validates a coupon against a server-computed subtotal and returns the discount. */
export async function evaluate(code, userId, subtotal) {
  const coupon = await Coupon.findOne({ code: String(code).trim().toUpperCase() }).select('+usedBy');
  if (!coupon || !coupon.isActive) throw ApiError.badRequest('This coupon code is not valid');
  if (coupon.expiresAt < new Date()) throw ApiError.badRequest('This coupon has expired');
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw ApiError.badRequest('This coupon has reached its usage limit');
  const usedByMe = coupon.usedBy.filter((u) => u.equals(userId)).length;
  if (coupon.perUserLimit && usedByMe >= coupon.perUserLimit) throw ApiError.badRequest('You have already used this coupon');
  if (subtotal < coupon.minOrder) throw ApiError.badRequest(`Add items worth ₹${Math.ceil(coupon.minOrder - subtotal)} more to use this coupon`);

  let discount = coupon.type === 'PERCENTAGE' ? (subtotal * coupon.value) / 100 : coupon.value;
  if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  discount = round2(Math.min(discount, subtotal));
  return { coupon, discount };
}

export async function recordUsage(couponId, userId) {
  await Coupon.updateOne({ _id: couponId }, { $inc: { usedCount: 1 }, $push: { usedBy: userId } });
}

export async function listAvailable() {
  return Coupon.find({ isActive: true, expiresAt: { $gt: new Date() } }).select('code description type value minOrder maxDiscount expiresAt').sort({ minOrder: 1 }).lean();
}

// ----- Admin -----
export const listAll = () => Coupon.find().sort({ createdAt: -1 }).lean();

export async function create(data) {
  if (await Coupon.exists({ code: data.code.toUpperCase() })) throw ApiError.conflict('A coupon with this code already exists');
  return Coupon.create(data);
}

export async function update(id, data) {
  const coupon = await Coupon.findById(id);
  if (!coupon) throw ApiError.notFound('Coupon not found');
  Object.assign(coupon, data);
  await coupon.save();
  return coupon;
}

export async function remove(id) {
  const coupon = await Coupon.findByIdAndDelete(id);
  if (!coupon) throw ApiError.notFound('Coupon not found');
  return coupon;
}
