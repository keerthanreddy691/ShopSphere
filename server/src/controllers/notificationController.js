import * as svc from '../services/notificationService.js';
import { ok } from '../utils/response.js';
import { getPagination, paginated } from '../utils/pagination.js';

export async function list(req, res) {
  const pg = getPagination(req.query, 20);
  const { items, total, unread } = await svc.listForUser(req.user._id, pg);
  return ok(res, { ...paginated(items, total, pg), unread });
}

export async function unread(req, res) {
  return ok(res, { unread: await svc.unreadCount(req.user._id) });
}

export async function markRead(req, res) {
  await svc.markRead(req.user._id, req.params.id);
  return ok(res, {}, 'Marked as read');
}

export async function markAllRead(req, res) {
  await svc.markAllRead(req.user._id);
  return ok(res, {}, 'All notifications marked as read');
}
