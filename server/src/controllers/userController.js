import * as userService from '../services/userService.js';
import { getProfile } from '../services/authService.js';
import { audit } from '../services/auditService.js';
import { ok, created } from '../utils/response.js';
import { getPagination } from '../utils/pagination.js';

export async function updateProfile(req, res) {
  const user = await userService.updateProfile(req.user, req.body);
  return ok(res, { user: await getProfile(user) }, 'Profile updated');
}

export async function changePassword(req, res) {
  await userService.changePassword(req.user._id, req.body);
  return ok(res, {}, 'Password changed');
}

export async function list(req, res) {
  const data = await userService.listUsers(req.query, getPagination(req.query, 20));
  return ok(res, data);
}

export async function setStatus(req, res) {
  const isActive = Boolean(req.body.isActive);
  const user = await userService.setActive(req.user._id, req.params.id, isActive);
  await audit(req, isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED', 'User', user._id, { email: user.email });
  return ok(res, { user }, isActive ? 'User activated' : 'User deactivated');
}

export async function createStaff(req, res) {
  const user = await userService.createStaff(req.body);
  await audit(req, 'STAFF_CREATED', 'User', user._id, { email: user.email, role: user.role });
  return created(res, { user }, 'User created');
}
