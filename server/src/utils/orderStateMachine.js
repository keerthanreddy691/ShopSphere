import { ApiError } from './ApiError.js';

// from -> { to: [roles allowed to perform the transition] }
// SYSTEM is used for transitions driven internally (delivery completion, refunds).
const TRANSITIONS = {
  PLACED: { CONFIRMED: ['SELLER', 'ADMIN'], CANCELLED: ['CUSTOMER', 'SELLER', 'ADMIN'] },
  CONFIRMED: { PACKED: ['SELLER', 'ADMIN'], CANCELLED: ['CUSTOMER', 'SELLER', 'ADMIN'] },
  PACKED: { SHIPPED: ['SELLER', 'ADMIN'] },
  SHIPPED: { DELIVERED: ['DELIVERY', 'ADMIN', 'SYSTEM'] },
  DELIVERED: { RETURN_REQUESTED: ['CUSTOMER', 'SYSTEM'] },
  RETURN_REQUESTED: { RETURNED: ['SELLER', 'SUPPORT', 'ADMIN', 'SYSTEM'], DELIVERED: ['SELLER', 'SUPPORT', 'ADMIN', 'SYSTEM'] },
  RETURNED: { REFUNDED: ['SELLER', 'SUPPORT', 'ADMIN', 'SYSTEM'] },
  CANCELLED: {},
  REFUNDED: {},
};

export const ORDER_FLOW = ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'];

export function canTransition(from, to, role) {
  const allowed = TRANSITIONS[from]?.[to];
  return Boolean(allowed && (allowed.includes(role) || role === 'SYSTEM'));
}

export function assertTransition(from, to, role) {
  if (!TRANSITIONS[from]?.[to]) {
    throw ApiError.badRequest(`Invalid status change: ${from} → ${to}`);
  }
  if (!canTransition(from, to, role)) {
    throw ApiError.forbidden(`${role} cannot change order status from ${from} to ${to}`);
  }
}

export function nextStatusesFor(from, role) {
  return Object.entries(TRANSITIONS[from] || {})
    .filter(([, roles]) => roles.includes(role))
    .map(([to]) => to);
}
