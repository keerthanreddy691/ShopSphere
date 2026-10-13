import { Product } from '../models/Product.js';
import { Inventory } from '../models/Inventory.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Atomically decrement stock for one line. Returns true when stock was available.
 * Uses a conditional update so two concurrent checkouts can never oversell.
 */
export async function decrement({ productId, variantId, quantity }) {
  const filter = variantId
    ? { _id: productId, variants: { $elemMatch: { _id: variantId, stock: { $gte: quantity } } } }
    : { _id: productId, stock: { $gte: quantity } };
  const inc = variantId
    ? { 'variants.$.stock': -quantity, stock: -quantity, soldCount: quantity }
    : { stock: -quantity, soldCount: quantity };
  const res = await Product.updateOne(filter, { $inc: inc });
  return res.modifiedCount === 1;
}

export async function increment({ productId, variantId, quantity, reduceSold = true }) {
  const inc = { stock: quantity, ...(reduceSold ? { soldCount: -quantity } : {}) };
  if (variantId) {
    inc['variants.$.stock'] = quantity;
    await Product.updateOne({ _id: productId, 'variants._id': variantId }, { $inc: inc });
  } else {
    await Product.updateOne({ _id: productId }, { $inc: inc });
  }
}

export async function log({ product, seller, variantId, type, quantity, reason, order, performedBy }) {
  const p = await Product.findById(product).select('stock variants').lean();
  const stockAfter = variantId ? p?.variants?.find((v) => v._id.equals(variantId))?.stock : p?.stock;
  return Inventory.create({ product, seller, variantId, type, quantity, reason, order, performedBy, stockAfter });
}

export async function listForSeller(sellerId, { lowStock, search }) {
  const filter = { seller: sellerId };
  if (search) filter.name = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  if (lowStock === 'true') filter.$expr = { $lte: ['$stock', '$lowStockThreshold'] };
  return Product.find(filter)
    .select('name slug images sku stock lowStockThreshold variants soldCount moderationStatus status finalPrice')
    .sort({ stock: 1 })
    .lean({ flattenMaps: true });
}

export async function updateStock(sellerUser, productId, { stock, variants, lowStockThreshold, reason }) {
  const product = await Product.findById(productId);
  if (!product) throw ApiError.notFound('Product not found');
  if (sellerUser.role !== 'ADMIN' && !product.seller.equals(sellerUser._id)) throw ApiError.forbidden('You can only manage your own inventory');

  const movements = [];
  if (variants?.length && product.variants.length) {
    for (const { _id, stock: newStock } of variants) {
      const v = product.variants.id(_id);
      if (!v) throw ApiError.badRequest('Variant not found on this product');
      if (v.stock !== newStock) movements.push({ variantId: v._id, quantity: newStock - v.stock });
      v.stock = newStock;
    }
  } else if (stock !== undefined) {
    if (product.variants.length) throw ApiError.badRequest('This product has variants. Update stock per variant.');
    if (product.stock !== stock) movements.push({ variantId: null, quantity: stock - product.stock });
    product.stock = stock;
  }
  if (lowStockThreshold !== undefined) product.lowStockThreshold = lowStockThreshold;
  await product.save();

  for (const m of movements) {
    await log({ product: product._id, seller: product.seller, variantId: m.variantId, type: m.quantity > 0 ? 'RESTOCK' : 'ADJUSTMENT', quantity: m.quantity, reason, performedBy: sellerUser._id });
  }
  return product;
}

export async function history(sellerUser, productId) {
  const product = await Product.findById(productId).select('seller').lean();
  if (!product) throw ApiError.notFound('Product not found');
  if (sellerUser.role !== 'ADMIN' && !product.seller.equals(sellerUser._id)) throw ApiError.forbidden();
  return Inventory.find({ product: productId }).sort({ createdAt: -1 }).limit(100).populate('order', 'orderNumber').lean();
}
