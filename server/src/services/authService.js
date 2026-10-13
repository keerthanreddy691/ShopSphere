import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Seller } from '../models/Seller.js';
import { ApiError } from '../utils/ApiError.js';
import { notifyRole } from './notificationService.js';

export const signToken = (user) => jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

export const cookieOptions = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: env.isProd ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

export async function register({ name, email, password, phone, role, businessName, gstin }) {
  if (await User.exists({ email: email.toLowerCase() })) {
    throw ApiError.conflict('An account with this email already exists');
  }
  const user = await User.create({ name, email, password, phone, role });
  if (role === 'SELLER') {
    await Seller.create({ user: user._id, businessName: businessName || `${name}'s Store`, gstin: gstin || '', phone: phone || '' });
    await notifyRole('ADMIN', {
      type: 'SELLER_APPLICATION',
      title: 'New seller application',
      message: `${businessName || name} applied to sell on ShopSphere.`,
      link: '/admin/seller-applications',
    });
  }
  return user;
}

export async function login({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (!user.isActive) throw ApiError.forbidden('Your account has been deactivated. Contact support.');
  user.lastLoginAt = new Date();
  await user.save();
  return user;
}

export async function getProfile(user) {
  const data = user.toJSON();
  if (user.role === 'SELLER') {
    const seller = await Seller.findOne({ user: user._id }).lean();
    data.seller = seller ? { _id: seller._id, status: seller.status, businessName: seller.businessName, rejectionReason: seller.rejectionReason } : null;
  }
  return data;
}
