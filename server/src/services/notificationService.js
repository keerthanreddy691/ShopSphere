import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';

export async function notify(userId, { type = 'GENERAL', title, message = '', link = '' }) {
  if (!userId) return null;
  try {
    return await Notification.create({ user: userId, type, title, message, link });
  } catch (err) {
    console.error('Failed to create notification', err.message);
    return null;
  }
}

export async function notifyRole(role, payload) {
  const users = await User.find({ role, isActive: true }).select('_id').lean();
  await Promise.all(users.map((u) => notify(u._id, payload)));
}

export async function listForUser(userId, { page, limit, skip }) {
  const [items, total, unread] = await Promise.all([
    Notification.find({ user: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments({ user: userId }),
    Notification.countDocuments({ user: userId, isRead: false }),
  ]);
  return { items, total, unread };
}

export const markRead = (userId, id) => Notification.updateOne({ _id: id, user: userId }, { isRead: true });
export const markAllRead = (userId) => Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
export const unreadCount = (userId) => Notification.countDocuments({ user: userId, isRead: false });
