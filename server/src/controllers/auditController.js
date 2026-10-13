import { AuditLog } from '../models/AuditLog.js';
import { ok } from '../utils/response.js';
import { getPagination, paginated } from '../utils/pagination.js';

export async function list(req, res) {
  const pg = getPagination(req.query, 25);
  const filter = {};
  if (req.query.action) filter.action = req.query.action;
  if (req.query.entity) filter.entity = req.query.entity;
  const [items, total, actions] = await Promise.all([
    AuditLog.find(filter).populate('actor', 'name email').sort({ createdAt: -1 }).skip(pg.skip).limit(pg.limit).lean(),
    AuditLog.countDocuments(filter),
    AuditLog.distinct('action'),
  ]);
  return ok(res, { ...paginated(items, total, pg), actions });
}
