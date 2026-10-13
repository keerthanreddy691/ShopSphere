import { SupportTicket } from '../models/SupportTicket.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { paginated } from '../utils/pagination.js';
import { notify, notifyRole } from './notificationService.js';

export async function createTicket(customer, { subject, category = 'OTHER', priority = 'MEDIUM', message, orderId }) {
  if (!subject || !message) {
    throw ApiError.badRequest('Subject and message are required');
  }

  const ticketNumber = `TCK-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

  const ticket = await SupportTicket.create({
    ticketNumber,
    customer: customer._id,
    order: orderId || null,
    subject: subject.trim(),
    category,
    priority,
    messages: [
      {
        sender: customer._id,
        senderRole: 'CUSTOMER',
        message: message.trim(),
        at: new Date(),
      },
    ],
    status: 'OPEN',
  });

  await notifyRole('SUPPORT', {
    type: 'SUPPORT_TICKET',
    title: `New support ticket #${ticketNumber}`,
    message: `${customer.name}: ${subject}`,
    link: `/support`,
  });

  return ticket;
}

export async function listForCustomer(customerId, query, pg) {
  const filter = { customer: customerId };
  if (query.status) filter.status = query.status;

  const [items, total] = await Promise.all([
    SupportTicket.find(filter)
      .select('ticketNumber subject category priority status createdAt updatedAt messages')
      .sort({ updatedAt: -1 })
      .skip(pg.skip)
      .limit(pg.limit)
      .lean(),
    SupportTicket.countDocuments(filter),
  ]);

  return paginated(
    items.map((t) => ({
      ...t,
      lastMessage: t.messages[t.messages.length - 1] || null,
      messageCount: t.messages.length,
    })),
    total,
    pg,
  );
}

export async function getForCustomer(customerId, id) {
  const ticket = await SupportTicket.findOne({ _id: id, customer: customerId })
    .populate('order', 'orderNumber total status createdAt')
    .populate('assignedTo', 'name')
    .populate('messages.sender', 'name avatar role')
    .lean();

  if (!ticket) throw ApiError.notFound('Support ticket not found');
  return ticket;
}

export async function addCustomerMessage(customerId, id, messageText) {
  if (!messageText?.trim()) throw ApiError.badRequest('Message cannot be empty');

  const ticket = await SupportTicket.findOne({ _id: id, customer: customerId });
  if (!ticket) throw ApiError.notFound('Support ticket not found');

  if (ticket.status === 'CLOSED') {
    throw ApiError.badRequest('This ticket is closed. Please open a new ticket if you need further help.');
  }

  ticket.messages.push({
    sender: customerId,
    senderRole: 'CUSTOMER',
    message: messageText.trim(),
    at: new Date(),
  });

  if (['WAITING_FOR_CUSTOMER', 'RESOLVED'].includes(ticket.status)) {
    ticket.status = 'IN_PROGRESS';
  }

  await ticket.save();

  if (ticket.assignedTo) {
    await notify(ticket.assignedTo, {
      type: 'TICKET_REPLY',
      title: `Customer replied on #${ticket.ticketNumber}`,
      message: messageText.slice(0, 100),
      link: `/support`,
    });
  }

  return ticket;
}

// ----- Staff / Support -----
export async function listForStaff(query, pg) {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.category) filter.category = query.category;
  if (query.assignedTo) filter.assignedTo = query.assignedTo;
  if (query.search) {
    filter.$or = [
      { ticketNumber: new RegExp(query.search, 'i') },
      { subject: new RegExp(query.search, 'i') },
    ];
  }

  const [items, total, counts] = await Promise.all([
    SupportTicket.find(filter)
      .populate('customer', 'name email phone')
      .populate('assignedTo', 'name email')
      .sort({ updatedAt: -1 })
      .skip(pg.skip)
      .limit(pg.limit)
      .lean(),
    SupportTicket.countDocuments(filter),
    SupportTicket.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
  ]);

  return {
    ...paginated(
      items.map((t) => ({
        ...t,
        lastMessage: t.messages[t.messages.length - 1] || null,
        messageCount: t.messages.length,
      })),
      total,
      pg,
    ),
    counts: Object.fromEntries(counts.map((c) => [c._id, c.n])),
  };
}

export async function getForStaff(id) {
  const ticket = await SupportTicket.findById(id)
    .populate('customer', 'name email phone address')
    .populate('assignedTo', 'name email')
    .populate('order', 'orderNumber total status createdAt paymentMethod')
    .populate('messages.sender', 'name avatar role')
    .lean();

  if (!ticket) throw ApiError.notFound('Support ticket not found');
  return ticket;
}

export async function assign(id, staffId) {
  const staff = await User.findOne({ _id: staffId, role: { $in: ['SUPPORT', 'ADMIN'] } });
  if (!staff) throw ApiError.badRequest('Support agent not found');

  const ticket = await SupportTicket.findById(id);
  if (!ticket) throw ApiError.notFound('Support ticket not found');

  ticket.assignedTo = staff._id;
  if (ticket.status === 'OPEN') ticket.status = 'IN_PROGRESS';
  await ticket.save();

  await notify(staff._id, {
    type: 'TICKET_ASSIGNED',
    title: `Ticket #${ticket.ticketNumber} assigned to you`,
    message: ticket.subject,
    link: `/support`,
  });

  return ticket;
}

export async function updateStatus(id, status) {
  const ticket = await SupportTicket.findById(id);
  if (!ticket) throw ApiError.notFound('Support ticket not found');

  ticket.status = status;
  await ticket.save();

  await notify(ticket.customer, {
    type: 'TICKET_STATUS',
    title: `Ticket #${ticket.ticketNumber} is now ${status.replace(/_/g, ' ').toLowerCase()}`,
    message: `Your ticket "${ticket.subject}" has been marked ${status.replace(/_/g, ' ').toLowerCase()}.`,
    link: `/account/support`,
  });

  return ticket;
}

export async function addStaffMessage(staffUser, id, messageText, nextStatus) {
  if (!messageText?.trim()) throw ApiError.badRequest('Message cannot be empty');

  const ticket = await SupportTicket.findById(id);
  if (!ticket) throw ApiError.notFound('Support ticket not found');

  ticket.messages.push({
    sender: staffUser._id,
    senderRole: staffUser.role,
    message: messageText.trim(),
    at: new Date(),
  });

  if (nextStatus) {
    ticket.status = nextStatus;
  } else if (ticket.status === 'OPEN') {
    ticket.status = 'WAITING_FOR_CUSTOMER';
  } else if (ticket.status === 'IN_PROGRESS') {
    ticket.status = 'WAITING_FOR_CUSTOMER';
  }

  if (!ticket.assignedTo) {
    ticket.assignedTo = staffUser._id;
  }

  await ticket.save();

  await notify(ticket.customer, {
    type: 'TICKET_REPLY',
    title: `New reply on ticket #${ticket.ticketNumber}`,
    message: messageText.slice(0, 120),
    link: `/account/support`,
  });

  return ticket;
}

