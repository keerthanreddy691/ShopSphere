import mongoose from 'mongoose';
import { Product, priceAfterDiscount } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { Store } from '../models/Store.js';
import { User } from '../models/User.js';
import { OrderItem } from '../models/OrderItem.js';
import { Cart } from '../models/Cart.js';
import { Wishlist } from '../models/Wishlist.js';
import { ApiError } from '../utils/ApiError.js';
import { uniqueSlug } from '../utils/slugify.js';
import { paginated } from '../utils/pagination.js';
import * as inventory from './inventoryService.js';

export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const LIST_FIELDS = 'name slug images brand price discount finalPrice rating reviewCount stock soldCount category store seller isFeatured tags createdAt shortDescription variants';

export const variantLabel = (variant) =>
  variant ? Object.entries(variant.options instanceof Map ? Object.fromEntries(variant.options) : variant.options || {}).map(([k, v]) => `${k}: ${v}`).join(', ') : '';

export function unitPrice(product, variant) {
  const mrp = variant?.price ?? product.price;
  return { mrp, price: priceAfterDiscount(mrp, product.discount) };
}

// Base filter for anything publicly visible.
export async function publicFilter() {
  const [inactiveCats, inactiveStores] = await Promise.all([
    Category.find({ isActive: false }).distinct('_id'),
    Store.find({ status: 'INACTIVE' }).distinct('_id'),
  ]);
  const filter = { moderationStatus: 'APPROVED', status: 'ACTIVE' };
  if (inactiveCats.length) filter.category = { $nin: inactiveCats };
  if (inactiveStores.length) filter.store = { $nin: inactiveStores };
  return filter;
}

const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { finalPrice: 1 },
  price_desc: { finalPrice: -1 },
  rating: { rating: -1, reviewCount: -1 },
  popular: { soldCount: -1 },
  discount: { discount: -1 },
  relevance: { isFeatured: -1, soldCount: -1 },
};

export async function listPublic(query, pg) {
  const filter = await publicFilter();
  const and = [];
  if (query.q?.trim()) {
    const rx = new RegExp(escapeRegex(query.q.trim()), 'i');
    const catIds = await Category.find({ name: rx }).distinct('_id');
    and.push({ $or: [{ name: rx }, { brand: rx }, { tags: rx }, { shortDescription: rx }, { category: { $in: catIds } }] });
  }
  if (query.category) {
    const slugs = String(query.category).split(',');
    const cats = await Category.find({ $or: [{ slug: { $in: slugs } }, ...slugs.filter(mongoose.isValidObjectId).map((id) => ({ _id: id }))] }).distinct('_id');
    and.push({ category: { $in: cats } });
  }
  if (query.store) {
    const store = await Store.findOne({ slug: query.store }).select('_id').lean();
    and.push({ store: store?._id || null });
  }
  if (query.seller && mongoose.isValidObjectId(query.seller)) and.push({ seller: query.seller });
  if (query.brand) and.push({ brand: { $in: String(query.brand).split(',') } });
  const min = Number(query.minPrice);
  const max = Number(query.maxPrice);
  if (query.minPrice && !Number.isNaN(min)) and.push({ finalPrice: { $gte: min } });
  if (query.maxPrice && !Number.isNaN(max)) and.push({ finalPrice: { $lte: max } });
  if (query.rating) and.push({ rating: { $gte: Number(query.rating) || 0 } });
  if (query.inStock === 'true') and.push({ stock: { $gt: 0 } });
  if (query.discount) and.push({ discount: { $gte: Number(query.discount) || 0 } });
  if (query.featured === 'true') and.push({ isFeatured: true });
  if (query.exclude && mongoose.isValidObjectId(query.exclude)) and.push({ _id: { $ne: query.exclude } });
  if (and.length) filter.$and = and;

  const sort = SORTS[query.sort] || SORTS.relevance;
  const [items, total] = await Promise.all([
    Product.find(filter)
      .select(LIST_FIELDS)
      .populate('store', 'name slug logo')
      .populate('category', 'name slug')
      .sort({ ...sort, _id: 1 })
      .skip(pg.skip)
      .limit(pg.limit)
      .lean({ flattenMaps: true }),
    Product.countDocuments(filter),
  ]);
  return paginated(items, total, pg);
}

export async function brands() {
  const filter = await publicFilter();
  return (await Product.distinct('brand', filter)).filter(Boolean).sort();
}

export async function getPublic(slugOrId, viewer) {
  const filter = mongoose.isValidObjectId(slugOrId) ? { _id: slugOrId } : { slug: slugOrId };
  const product = await Product.findOne(filter)
    .populate('store', 'name slug logo rating ratingCount city')
    .populate('category', 'name slug')
    .populate('seller', 'name')
    .lean({ flattenMaps: true });
  const isOwner = viewer && (viewer.role === 'ADMIN' || product?.seller?._id?.equals(viewer._id));
  if (!product || ((product.moderationStatus !== 'APPROVED' || product.status !== 'ACTIVE') && !isOwner)) {
    throw ApiError.notFound('Product not found');
  }
  await Product.updateOne({ _id: product._id }, { $inc: { views: 1 } });
  if (viewer?.role === 'CUSTOMER') {
    await User.updateOne({ _id: viewer._id }, { $pull: { recentlyViewed: { product: product._id } } });
    await User.updateOne(
      { _id: viewer._id },
      { $push: { recentlyViewed: { $each: [{ product: product._id, viewedAt: new Date() }], $position: 0, $slice: 20 } } },
    );
  }
  return product;
}

// ---------- Seller CRUD ----------
function normalizeVariants(variants = []) {
  return variants.map((v) => ({ ...v, price: v.price ?? undefined }));
}

export async function listForSeller(sellerId, query, pg) {
  const filter = { seller: sellerId };
  if (query.q) filter.name = new RegExp(escapeRegex(query.q), 'i');
  if (query.moderationStatus) filter.moderationStatus = query.moderationStatus;
  if (query.status) filter.status = query.status;
  const [items, total] = await Promise.all([
    Product.find(filter).populate('category', 'name').sort({ createdAt: -1 }).skip(pg.skip).limit(pg.limit).lean({ flattenMaps: true }),
    Product.countDocuments(filter),
  ]);
  return paginated(items, total, pg);
}

export async function getOwn(user, id) {
  const product = await Product.findById(id).populate('category', 'name slug').lean({ flattenMaps: true });
  if (!product) throw ApiError.notFound('Product not found');
  if (user.role !== 'ADMIN' && !product.seller.equals(user._id)) throw ApiError.forbidden('You can only view your own products');
  return product;
}

export async function create(user, data) {
  const store = await Store.findOne({ seller: user._id });
  if (!store) throw ApiError.badRequest('Create your store before adding products');
  if (!(await Category.exists({ _id: data.category, isActive: true }))) throw ApiError.badRequest('Invalid or inactive category');
  const slug = await uniqueSlug(Product, data.name);
  const product = await Product.create({
    ...data,
    variants: normalizeVariants(data.variants),
    slug,
    seller: user._id,
    store: store._id,
    moderationStatus: 'PENDING',
  });
  await inventory.log({ product: product._id, seller: user._id, type: 'INITIAL', quantity: product.stock, reason: 'Product created', performedBy: user._id });
  return product;
}

export async function update(user, id, data) {
  const product = await Product.findById(id);
  if (!product) throw ApiError.notFound('Product not found');
  if (user.role !== 'ADMIN' && !product.seller.equals(user._id)) throw ApiError.forbidden('You can only edit your own products');
  if (data.category && !(await Category.exists({ _id: data.category }))) throw ApiError.badRequest('Invalid category');
  if (data.name && data.name !== product.name) product.slug = await uniqueSlug(Product, data.name, id);
  if (data.variants) data.variants = normalizeVariants(data.variants);
  Object.assign(product, data);
  // Rejected products go back to the moderation queue once the seller edits them.
  if (product.moderationStatus === 'REJECTED' && user.role !== 'ADMIN') {
    product.moderationStatus = 'PENDING';
    product.moderationNote = '';
  }
  await product.save();
  return product;
}

export async function remove(user, id) {
  const product = await Product.findById(id);
  if (!product) throw ApiError.notFound('Product not found');
  if (user.role !== 'ADMIN' && !product.seller.equals(user._id)) throw ApiError.forbidden('You can only delete your own products');
  const hasOrders = await OrderItem.exists({ product: id });
  if (hasOrders) {
    product.status = 'INACTIVE';
    await product.save();
    return { archived: true };
  }
  await Promise.all([
    product.deleteOne(),
    Cart.updateMany({}, { $pull: { items: { product: product._id } } }),
    Wishlist.updateMany({}, { $pull: { products: product._id } }),
  ]);
  return { archived: false };
}

// ---------- Admin moderation ----------
export async function listForAdmin(query, pg) {
  const filter = {};
  if (query.moderationStatus) filter.moderationStatus = query.moderationStatus;
  if (query.q) filter.name = new RegExp(escapeRegex(query.q), 'i');
  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate('store', 'name slug')
      .populate('category', 'name')
      .sort({ moderationStatus: -1, createdAt: -1 })
      .skip(pg.skip)
      .limit(pg.limit)
      .lean({ flattenMaps: true }),
    Product.countDocuments(filter),
  ]);
  return paginated(items, total, pg);
}

export async function moderate(id, { status, note }) {
  const product = await Product.findById(id);
  if (!product) throw ApiError.notFound('Product not found');
  product.moderationStatus = status;
  product.moderationNote = note;
  await product.save();
  return product;
}

export async function toggleFeatured(id) {
  const product = await Product.findById(id);
  if (!product) throw ApiError.notFound('Product not found');
  product.isFeatured = !product.isFeatured;
  await product.save();
  return product;
}
