import { Store } from '../models/Store.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { uniqueSlug } from '../utils/slugify.js';

export async function listPublic({ limit = 12 } = {}) {
  const stores = await Store.find({ status: 'ACTIVE' }).sort({ rating: -1, ratingCount: -1 }).limit(Number(limit) || 12).lean();
  const counts = await Product.aggregate([
    { $match: { store: { $in: stores.map((s) => s._id) }, moderationStatus: 'APPROVED', status: 'ACTIVE' } },
    { $group: { _id: '$store', count: { $sum: 1 }, sold: { $sum: '$soldCount' } } },
  ]);
  const map = new Map(counts.map((c) => [c._id.toString(), c]));
  return stores.map((s) => ({ ...s, productCount: map.get(s._id.toString())?.count || 0, totalSold: map.get(s._id.toString())?.sold || 0 }));
}

export async function getBySlug(slug) {
  const store = await Store.findOne({ slug, status: 'ACTIVE' }).populate('seller', 'name createdAt').lean();
  if (!store) throw ApiError.notFound('Store not found');
  const [productCount, agg] = await Promise.all([
    Product.countDocuments({ store: store._id, moderationStatus: 'APPROVED', status: 'ACTIVE' }),
    Product.aggregate([{ $match: { store: store._id } }, { $group: { _id: null, sold: { $sum: '$soldCount' } } }]),
  ]);
  return { ...store, productCount, totalSold: agg[0]?.sold || 0 };
}

export const getMine = (sellerId) => Store.findOne({ seller: sellerId }).lean();

export async function upsertMine(sellerId, data) {
  let store = await Store.findOne({ seller: sellerId });
  if (!store) {
    const slug = await uniqueSlug(Store, data.name);
    store = await Store.create({ ...data, slug, seller: sellerId });
    return { store, created: true };
  }
  if (data.name !== store.name) store.slug = await uniqueSlug(Store, data.name, store._id);
  Object.assign(store, data);
  await store.save();
  return { store, created: false };
}

// Recompute a store's rating from its products' ratings (weighted by review count).
export async function recomputeRating(storeId) {
  const [agg] = await Product.aggregate([
    { $match: { store: storeId, reviewCount: { $gt: 0 } } },
    { $group: { _id: null, weighted: { $sum: { $multiply: ['$rating', '$reviewCount'] } }, count: { $sum: '$reviewCount' } } },
  ]);
  const rating = agg?.count ? Math.round((agg.weighted / agg.count) * 10) / 10 : 0;
  await Store.updateOne({ _id: storeId }, { rating, ratingCount: agg?.count || 0 });
}
