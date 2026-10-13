import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Seller } from '../models/Seller.js';
import { ApiError } from '../utils/ApiError.js';

async function resolveUser(req) {
  const bearer = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null;
  const token = req.cookies?.token || bearer;
  if (!token) return null;
  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    return null;
  }
  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) return null;
  return user;
}

export async function authenticate(req, _res, next) {
  const user = await resolveUser(req);
  if (!user) throw ApiError.unauthorized('Please log in to continue');
  req.user = user;
  next();
}

// Attaches req.user when a valid session exists, but never rejects.
export async function optionalAuth(req, _res, next) {
  req.user = (await resolveUser(req)) || null;
  next();
}

export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) throw ApiError.unauthorized();
  if (!roles.includes(req.user.role)) throw ApiError.forbidden();
  next();
};

// Sellers must be approved by an admin before they can manage a store or products.
export async function requireApprovedSeller(req, _res, next) {
  if (req.user.role === 'ADMIN') return next();
  const seller = await Seller.findOne({ user: req.user._id });
  if (!seller) throw ApiError.forbidden('Seller profile not found');
  if (seller.status !== 'APPROVED') {
    throw ApiError.forbidden(`Your seller application is ${seller.status.toLowerCase()}. An admin must approve it first.`);
  }
  req.seller = seller;
  next();
}

// Attaches req.seller (any status) for seller-only pages such as application status.
export async function attachSeller(req, _res, next) {
  req.seller = await Seller.findOne({ user: req.user._id });
  next();
}
