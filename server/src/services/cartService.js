import mongoose from 'mongoose';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { round2 } from '../utils/money.js';
import { unitPrice, variantLabel } from './productService.js';

export const MAX_QTY = 10;
export const FREE_SHIPPING_THRESHOLD = 499;
export const SHIPPING_FEE = 49;
export const shippingFor = (subtotal) => (subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE);

const getOrCreate = async (userId) => (await Cart.findOne({ user: userId })) || Cart.create({ user: userId, items: [] });

/**
 * Builds the priced cart view from live product data. Prices are ALWAYS computed on the
 * server from the current catalogue — nothing the client sends is trusted.
 */
export async function buildCart(userId) {
  const cart = await getOrCreate(userId);
  const ids = cart.items.map((i) => i.product);
  const products = await Product.find({ _id: { $in: ids } })
    .populate('store', 'name slug logo status')
    .populate('seller', 'name')
    .lean({ flattenMaps: true });
  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  // Drop lines whose product was deleted.
  const stale = cart.items.filter((i) => !byId.has(i.product.toString()));
  if (stale.length) {
    cart.items = cart.items.filter((i) => byId.has(i.product.toString()));
    await cart.save();
  }

  const items = cart.items.map((line) => {
    const p = byId.get(line.product.toString());
    const variant = line.variantId ? p.variants.find((v) => v._id.equals(line.variantId)) : null;
    const { mrp, price } = unitPrice(p, variant);
    const stock = variant ? variant.stock : p.stock;
    let issue = '';
    if (p.moderationStatus !== 'APPROVED' || p.status !== 'ACTIVE' || p.store?.status === 'INACTIVE') issue = 'No longer available';
    else if (line.variantId && !variant) issue = 'Selected option is no longer available';
    else if (stock <= 0) issue = 'Out of stock';
    else if (stock < line.quantity) issue = `Only ${stock} left in stock`;
    return {
      _id: line._id,
      product: { _id: p._id, name: p.name, slug: p.slug, image: p.images?.[0] || '', brand: p.brand, category: p.category },
      seller: { _id: p.seller?._id, name: p.seller?.name },
      store: p.store ? { _id: p.store._id, name: p.store.name, slug: p.store.slug, logo: p.store.logo } : null,
      variantId: line.variantId,
      variantLabel: variantLabel(variant),
      sku: variant?.sku || p.sku,
      quantity: line.quantity,
      stock,
      mrp,
      price,
      discount: p.discount,
      lineTotal: round2(price * line.quantity),
      available: !issue,
      issue,
    };
  });

  const groupsMap = new Map();
  for (const it of items) {
    const key = it.seller._id.toString();
    if (!groupsMap.has(key)) groupsMap.set(key, { seller: it.seller, store: it.store, items: [] });
    groupsMap.get(key).items.push(it);
  }
  const groups = [...groupsMap.values()].map((g) => {
    const subtotal = round2(g.items.filter((i) => i.available).reduce((s, i) => s + i.lineTotal, 0));
    return { ...g, subtotal, shippingFee: subtotal > 0 ? shippingFor(subtotal) : 0 };
  });
  const valid = items.filter((i) => i.available);
  const subtotal = round2(valid.reduce((s, i) => s + i.lineTotal, 0));
  const mrpTotal = round2(valid.reduce((s, i) => s + i.mrp * i.quantity, 0));
  const shipping = groups.reduce((s, g) => s + g.shippingFee, 0);
  return {
    items,
    groups,
    summary: {
      itemCount: items.reduce((s, i) => s + i.quantity, 0),
      sellerCount: groups.length,
      mrpTotal,
      productDiscount: round2(mrpTotal - subtotal),
      subtotal,
      shipping,
      total: round2(subtotal + shipping),
      hasIssues: items.some((i) => !i.available),
    },
  };
}

export async function addItem(userId, { productId, variantId, quantity = 1 }) {
  if (!mongoose.isValidObjectId(productId)) throw ApiError.badRequest('Invalid product');
  const product = await Product.findById(productId).lean();
  if (!product || product.moderationStatus !== 'APPROVED' || product.status !== 'ACTIVE') throw ApiError.notFound('Product is not available');
  let stock = product.stock;
  if (product.variants?.length) {
    const v = variantId && product.variants.find((x) => x._id.equals(variantId));
    if (!v) throw ApiError.badRequest('Please select a product option');
    stock = v.stock;
  } else {
    variantId = null;
  }
  if (stock <= 0) throw ApiError.badRequest('This item is out of stock');

  const cart = await getOrCreate(userId);
  const existing = cart.items.find((i) => i.product.equals(productId) && String(i.variantId || '') === String(variantId || ''));
  const desired = (existing?.quantity || 0) + quantity;
  const capped = Math.min(desired, stock, MAX_QTY);
  if (existing) existing.quantity = capped;
  else cart.items.push({ product: productId, variantId, quantity: capped });
  await cart.save();
  return { capped: capped < desired, cart: await buildCart(userId) };
}

export async function updateItem(userId, itemId, quantity) {
  const cart = await getOrCreate(userId);
  const line = cart.items.id(itemId);
  if (!line) throw ApiError.notFound('Cart item not found');
  const product = await Product.findById(line.product).lean();
  const stock = line.variantId ? product?.variants.find((v) => v._id.equals(line.variantId))?.stock ?? 0 : product?.stock ?? 0;
  if (quantity > stock) throw ApiError.badRequest(stock > 0 ? `Only ${stock} left in stock` : 'This item is out of stock');
  line.quantity = Math.min(quantity, MAX_QTY);
  await cart.save();
  return buildCart(userId);
}

export async function removeItem(userId, itemId) {
  await Cart.updateOne({ user: userId }, { $pull: { items: { _id: itemId } } });
  return buildCart(userId);
}

export const clear = (userId) => Cart.updateOne({ user: userId }, { items: [] });
