import mongoose from 'mongoose';
import { Review } from '../models/Review.js';
import { Order } from '../models/Order.js';
import { OrderItem } from '../models/OrderItem.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { paginated } from '../utils/pagination.js';
import * as storeService from './storeService.js';

export async function listForProduct(productId, pg) {
  const filter = { product: productId, status: 'PUBLISHED' };

  const [items, total, stats] = await Promise.all([
    Review.find(filter)
      .populate('customer', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(pg.skip)
      .limit(pg.limit)
      .lean(),
    Review.countDocuments(filter),
    Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(String(productId)), status: 'PUBLISHED' } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]),
  ]);

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  let count = 0;

  stats.forEach((s) => {
    distribution[s._id] = s.count;
    sum += s._id * s.count;
    count += s.count;
  });

  const average = count > 0 ? Math.round((sum / count) * 10) / 10 : 0;

  return {
    ...paginated(items, total, pg),
    summary: {
      average,
      count,
      distribution,
    },
  };
}

export async function createReview(customer, { orderId, orderItemId, rating, title, comment, images }) {
  const order = await Order.findOne({ _id: orderId, customer: customer._id });
  if (!order) throw ApiError.notFound('Order not found');
  if (order.status !== 'DELIVERED') {
    throw ApiError.badRequest('Reviews can only be submitted for delivered orders');
  }

  const orderItem = await OrderItem.findOne({ _id: orderItemId, order: order._id });
  if (!orderItem) throw ApiError.notFound('Order item not found');

  const alreadyReviewed = await Review.exists({ orderItem: orderItemId });
  if (alreadyReviewed) {
    throw ApiError.conflict('You have already submitted a review for this purchase');
  }

  const numRating = Math.max(1, Math.min(5, Number(rating) || 5));

  const review = await Review.create({
    product: orderItem.product,
    customer: customer._id,
    order: order._id,
    orderItem: orderItem._id,
    rating: numRating,
    title: title ? String(title).trim().slice(0, 120) : '',
    comment: comment ? String(comment).trim().slice(0, 2000) : '',
    images: Array.isArray(images) ? images : [],
    verifiedPurchase: true,
    status: 'PUBLISHED',
  });

  await OrderItem.updateOne({ _id: orderItemId }, { reviewed: true });

  // Recompute product rating and count
  const allReviews = await Review.find({ product: orderItem.product, status: 'PUBLISHED' }).select('rating').lean();
  const totalCount = allReviews.length;
  const avg = totalCount > 0 ? Math.round((allReviews.reduce((s, r) => s + r.rating, 0) / totalCount) * 10) / 10 : 0;

  const product = await Product.findByIdAndUpdate(
    orderItem.product,
    { rating: avg, reviewCount: totalCount },
    { new: true },
  );

  if (product?.store) {
    await storeService.recomputeRating(product.store);
  }

  return review;
}

export async function listAll(query, pg) {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.rating) filter.rating = Number(query.rating);

  const [items, total] = await Promise.all([
    Review.find(filter)
      .populate('product', 'name slug images brand')
      .populate('customer', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(pg.skip)
      .limit(pg.limit)
      .lean(),
    Review.countDocuments(filter),
  ]);

  return paginated(items, total, pg);
}

export async function updateStatus(id, status) {
  const review = await Review.findById(id);
  if (!review) throw ApiError.notFound('Review not found');

  review.status = status;
  await review.save();

  // Recompute product rating
  const allReviews = await Review.find({ product: review.product, status: 'PUBLISHED' }).select('rating').lean();
  const totalCount = allReviews.length;
  const avg = totalCount > 0 ? Math.round((allReviews.reduce((s, r) => s + r.rating, 0) / totalCount) * 10) / 10 : 0;

  const product = await Product.findByIdAndUpdate(
    review.product,
    { rating: avg, reviewCount: totalCount },
    { new: true },
  );

  if (product?.store) {
    await storeService.recomputeRating(product.store);
  }

  return review;
}

