import * as reviewService from '../services/reviewService.js';
import { ok, created } from '../utils/response.js';
import { getPagination } from '../utils/pagination.js';

export async function productReviews(req, res) {
  const data = await reviewService.listForProduct(req.params.productId, getPagination(req.query, 5, 20));
  return ok(res, data);
}

export async function createReview(req, res) {
  const review = await reviewService.createReview(req.user, req.body);
  return created(res, { review }, 'Review submitted successfully. Thank you!');
}

export async function listAll(req, res) {
  const data = await reviewService.listAll(req.query, getPagination(req.query, 20));
  return ok(res, data);
}

export async function updateStatus(req, res) {
  const review = await reviewService.updateStatus(req.params.id, req.body.status);
  return ok(res, { review }, `Review marked ${req.body.status.toLowerCase()}`);
}

