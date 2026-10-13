import * as returnService from '../services/returnService.js';
import { ok, created } from '../utils/response.js';
import { getPagination } from '../utils/pagination.js';

export async function createReturn(req, res) {
  const returnDoc = await returnService.createReturn(req.user, req.body);
  return created(res, { return: returnDoc }, 'Return request submitted successfully');
}

export async function myReturns(req, res) {
  const data = await returnService.listForCustomer(req.user._id, req.query, getPagination(req.query, 10));
  return ok(res, data);
}

export async function staffList(req, res) {
  const data = await returnService.listForStaff(req.user, req.query, getPagination(req.query, 15));
  return ok(res, data);
}

export async function getReturn(req, res) {
  const returnDoc = await returnService.getById(req.user, req.params.id);
  return ok(res, { return: returnDoc });
}

export async function updateStatus(req, res) {
  const returnDoc = await returnService.updateStatus(req.user, req.params.id, req.body);
  return ok(res, { return: returnDoc }, `Return status updated to ${req.body.status.toLowerCase()}`);
}

