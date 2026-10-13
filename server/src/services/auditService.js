import { AuditLog } from '../models/AuditLog.js';

export async function audit(req, action, entity, entityId, details = {}) {
  try {
    await AuditLog.create({
      actor: req.user._id,
      role: req.user.role,
      action,
      entity,
      entityId,
      details,
      ip: req.ip || '',
    });
  } catch (err) {
    console.error('Failed to write audit log', err.message);
  }
}
