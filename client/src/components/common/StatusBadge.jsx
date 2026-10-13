import { Badge } from '@/components/ui/badge';
import { titleCase } from '@/lib/format';

const MAP = {
  // orders
  PLACED: 'info', CONFIRMED: 'brand', PACKED: 'purple', SHIPPED: 'orange', DELIVERED: 'success',
  CANCELLED: 'danger', RETURN_REQUESTED: 'warning', RETURNED: 'purple', REFUNDED: 'default',
  // payments
  PENDING: 'warning', SUCCESS: 'success', FAILED: 'danger', REFUND_PENDING: 'warning',
  // moderation & sellers
  APPROVED: 'success', REJECTED: 'danger', SUSPENDED: 'danger',
  // returns
  REQUESTED: 'warning', RECEIVED: 'purple',
  // delivery
  AWAITING_DISPATCH: 'default', ASSIGNED: 'info', PICKED_UP: 'brand', IN_TRANSIT: 'orange', OUT_FOR_DELIVERY: 'purple',
  // tickets
  OPEN: 'info', IN_PROGRESS: 'brand', WAITING_FOR_CUSTOMER: 'warning', RESOLVED: 'success', CLOSED: 'default',
  // settlements
  PROCESSED: 'success', ON_HOLD: 'warning', REVERSED: 'danger',
  // generic
  ACTIVE: 'success', INACTIVE: 'default', PUBLISHED: 'success', HIDDEN: 'default',
  // AI labels
  NORMAL: 'success', SPAM: 'danger', ABUSIVE: 'danger', SUSPICIOUS: 'warning',
  // priority
  LOW: 'default', MEDIUM: 'info', HIGH: 'orange', URGENT: 'danger',
};

export function StatusBadge({ status, className, label }) {
  if (!status) return null;
  return (
    <Badge variant={MAP[status] || 'default'} className={className}>
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {label || titleCase(status)}
    </Badge>
  );
}
