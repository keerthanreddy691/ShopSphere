import * as supportService from '../services/supportService.js';
import { ok, created } from '../utils/response.js';
import { getPagination } from '../utils/pagination.js';

export async function createTicket(req, res) {
  const ticket = await supportService.createTicket(req.user, req.body);
  return created(res, { ticket }, 'Support ticket created successfully');
}

export async function myTickets(req, res) {
  const data = await supportService.listForCustomer(req.user._id, req.query, getPagination(req.query, 10));
  return ok(res, data);
}

export async function myTicket(req, res) {
  const ticket = await supportService.getForCustomer(req.user._id, req.params.id);
  return ok(res, { ticket });
}

export async function customerReply(req, res) {
  const ticket = await supportService.addCustomerMessage(req.user._id, req.params.id, req.body.message);
  return ok(res, { ticket }, 'Reply sent');
}

// Staff
export async function staffList(req, res) {
  const data = await supportService.listForStaff(req.query, getPagination(req.query, 15));
  return ok(res, data);
}

export async function staffTicket(req, res) {
  const ticket = await supportService.getForStaff(req.params.id);
  return ok(res, { ticket });
}

export async function assign(req, res) {
  const ticket = await supportService.assign(req.params.id, req.body.assignedTo || req.user._id);
  return ok(res, { ticket }, 'Ticket assigned');
}

export async function updateStatus(req, res) {
  const ticket = await supportService.updateStatus(req.params.id, req.body.status);
  return ok(res, { ticket }, `Ticket marked ${req.body.status.replace(/_/g, ' ').toLowerCase()}`);
}

export async function staffReply(req, res) {
  const ticket = await supportService.addStaffMessage(req.user, req.params.id, req.body.message, req.body.status);
  return ok(res, { ticket }, 'Reply sent to customer');
}

