import { Wishlist } from '../models/Wishlist.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { LIST_FIELDS } from './productService.js';

export async function get(userId) {
  const wl = await Wishlist.findOne({ user: userId }).lean();
  if (!wl?.products?.length) return [];
  const products = await Product.find({ _id: { $in: wl.products } })
    .select(`${LIST_FIELDS} moderationStatus status`)
    .populate('store', 'name slug')
    .lean({ flattenMaps: true });
  const map = new Map(products.map((p) => [p._id.toString(), p]));
  // Preserve most-recently-added-first order.
  return wl.products.map((id) => map.get(id.toString())).filter(Boolean).reverse();
}

export async function add(userId, productId) {
  if (!(await Product.exists({ _id: productId }))) throw ApiError.notFound('Product not found');
  await Wishlist.updateOne({ user: userId }, { $addToSet: { products: productId } }, { upsert: true });
}

export const remove = (userId, productId) => Wishlist.updateOne({ user: userId }, { $pull: { products: productId } });
