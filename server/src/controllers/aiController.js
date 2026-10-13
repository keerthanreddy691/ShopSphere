import * as aiService from '../services/ai/aiService.js';
import { ok } from '../utils/response.js';

export async function generateDescription(req, res) {
  const result = await aiService.generateProductDescription(req.body);
  return ok(res, result, 'Product description generated successfully');
}

export async function similar(req, res) {
  const result = await aiService.getSimilarProducts(req.params.productId, req.query.limit || 10);
  return ok(res, result);
}

export async function smartSearch(req, res) {
  const result = await aiService.smartSearch(req.query.q, Math.min(Number(req.query.limit) || 24, 48));
  return ok(res, result);
}

export async function recommendations(req, res) {
  const result = await aiService.getRecommendations(req.user, req.query.limit || 10);
  return ok(res, result);
}

