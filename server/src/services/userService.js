import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { paginated } from '../utils/pagination.js';

export async function updateProfile(user, data) {
  Object.assign(user, data);
  await user.save();
  return user;
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select('+password');
  if (!(await user.comparePassword(currentPassword))) throw ApiError.badRequest('Current password is incorrect');
  user.password = newPassword;
  await user.save();
}

export async function listUsers({ role, search, status }, pg) {
  const filter = {};
  if (role) filter.role = role;
  if (status === 'active') filter.isActive = true;
  if (status === 'inactive') filter.isActive = false;
  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(pg.skip).limit(pg.limit),
    User.countDocuments(filter),
  ]);
  return paginated(items, total, pg);
}

export async function setActive(actorId, userId, isActive) {
  if (actorId.toString() === userId) throw ApiError.badRequest('You cannot change your own account status');
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');
  user.isActive = isActive;
  await user.save();
  return user;
}

export async function createStaff(data) {
  if (await User.exists({ email: data.email })) throw ApiError.conflict('An account with this email already exists');
  return User.create(data);
}
