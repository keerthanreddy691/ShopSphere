import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingBag, Search, Eye, MapPin, Truck, CheckCircle2, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { get, patch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, Select, Field } from '@/components/ui/input';
import { Tabs } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog } from '@/components/ui/dialog';
import { TableWrap, Table, THead, TH, TBody, TR, TD } from '@/components/ui/table';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Pagination } from '@/components/common/Pagination';
import { SafeImage } from '@/components/common/SafeImage';
import { OrderTimeline } from '@/components/common/OrderTimeline';
import { formatPrice, formatDateTime, titleCase } from '@/lib/format';

const TABS = [
  { value: '', label: 'All Orders' },
  { value: 'PLACED', label: 'Placed' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PACKED', label: 'Packed' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function SellerOrdersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  // Active Order Detail Modal
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [nextStatus, setNextStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['seller-orders', { page, status, search }],
    queryFn: () => get('/orders', { page, limit: 15, status, q: search }),
  });

  const { data: orderDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ['seller-order-detail', selectedOrderId],
    queryFn: () => get(`/orders/${selectedOrderId}`).then((d) => d.order),
    enabled: Boolean(selectedOrderId),
  });

  const updateStatus = useMutation({
    mutationFn: () => patch(`/orders/${selectedOrderId}/status`, { status: nextStatus, note: statusNote }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Order status updated');
      setNextStatus('');
      setStatusNote('');
      qc.invalidateQueries({ queryKey: ['seller-orders'] });
      qc.invalidateQueries({ queryKey: ['seller-order-detail', selectedOrderId] });
      qc.invalidateQueries({ queryKey: ['seller-overview'] });
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  const orders = data?.items || [];
  const allowedActions = orderDetail?.allowedActions || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Incoming Orders</h1>
          <p className="mt-1 text-sm text-ink-muted">Process customer orders and hand packages over for delivery dispatch.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search order number or customer..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Tabs
          tabs={TABS}
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        />
      </div>

      {!orders.length ? (
        <Card>
          <EmptyState
            icon={ShoppingBag}
            title={status || search ? 'No orders match criteria' : 'No customer orders yet'}
            description="When buyers order items from your store, they will appear here for fulfillment."
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <TableWrap>
            <Table>
              <THead>
                <TR>
                  <TH>Order Number</TH>
                  <TH>Customer</TH>
                  <TH>Items</TH>
                  <TH>Total</TH>
                  <TH>Status</TH>
                  <TH>Placed Date</TH>
                  <TH className="text-right">Action</TH>
                </TR>
              </THead>
              <TBody>
                {orders.map((o) => (
                  <TR key={o._id}>
                    <TD className="font-mono text-sm font-bold text-ink">{o.orderNumber}</TD>
                    <TD>
                      <div>
                        <p className="font-semibold text-ink">{o.customer?.name || 'Customer'}</p>
                        <p className="text-xs text-ink-muted">{o.customer?.email}</p>
                      </div>
                    </TD>
                    <TD className="text-xs text-ink-muted">{o.itemCount} item(s)</TD>
                    <TD>
                      <span className="font-bold">{formatPrice(o.total)}</span>
                    </TD>
                    <TD>
                      <StatusBadge status={o.status} />
                    </TD>
                    <TD className="text-xs text-ink-muted">{formatDateTime(o.createdAt)}</TD>
                    <TD className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setSelectedOrderId(o._id)}
                      >
                        <Eye className="size-3.5" /> Manage
                      </Button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </TableWrap>
          <div className="border-t border-slate-100 p-4">
            <Pagination page={page} pages={data?.pagination?.pages} onChange={setPage} />
          </div>
        </Card>
      )}

      {/* Order Detail Modal */}
      <Dialog
        open={Boolean(selectedOrderId)}
        onClose={() => {
          setSelectedOrderId(null);
          setNextStatus('');
        }}
        size="lg"
        title={`Order #${orderDetail?.orderNumber || ''}`}
        description={`Placed on ${formatDateTime(orderDetail?.createdAt)}`}
      >
        {loadingDetail || !orderDetail ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4">
              <div>
                <p className="text-xs text-ink-muted">Current Status</p>
                <div className="mt-1">
                  <StatusBadge status={orderDetail.status} />
                </div>
              </div>
              <div>
                <p className="text-xs text-ink-muted">Total Paid</p>
                <p className="text-base font-bold text-ink">{formatPrice(orderDetail.total)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">Your Earnings</p>
                <p className="text-base font-bold text-emerald-600">
                  {formatPrice(orderDetail.sellerEarning || orderDetail.total)}
                </p>
              </div>
            </div>

            {/* Allowed Status Transition Section */}
            {allowedActions.length > 0 && orderDetail.status !== 'DELIVERED' && (
              <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-700">Update Order Status</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {allowedActions.map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={nextStatus === s ? 'default' : 'outline'}
                      onClick={() => setNextStatus(s)}
                    >
                      Mark {titleCase(s)}
                    </Button>
                  ))}
                </div>

                {nextStatus && (
                  <div className="mt-3 space-y-2">
                    <Input
                      placeholder="Optional note for status update (e.g. tracking barcode)"
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                    />
                    <Button
                      size="sm"
                      loading={updateStatus.isPending}
                      onClick={() => updateStatus.mutate()}
                    >
                      Confirm: Mark as {titleCase(nextStatus)}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Items */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-ink-muted">Ordered Items</p>
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {orderDetail.items?.map((it) => (
                  <li key={it._id} className="flex items-center gap-3 p-3">
                    <SafeImage src={it.image} alt="" className="size-12 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm line-clamp-1">{it.name}</p>
                      <p className="text-xs text-ink-muted">
                        Qty {it.quantity} × {formatPrice(it.price)}
                      </p>
                    </div>
                    <p className="text-sm font-bold">{formatPrice(it.lineTotal)}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Delivery address */}
            <div className="rounded-xl border border-slate-200 p-4 text-sm">
              <p className="flex items-center gap-1.5 font-semibold text-ink">
                <MapPin className="size-4 text-brand-600" /> Shipping Destination
              </p>
              <p className="mt-1 font-medium">{orderDetail.shippingAddress?.fullName}</p>
              <p className="text-xs text-ink-muted">
                {[
                  orderDetail.shippingAddress?.line1,
                  orderDetail.shippingAddress?.line2,
                  orderDetail.shippingAddress?.city,
                  orderDetail.shippingAddress?.state,
                  orderDetail.shippingAddress?.pincode,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              {orderDetail.shippingAddress?.phone && (
                <p className="mt-1 text-xs text-ink-muted">Phone: {orderDetail.shippingAddress.phone}</p>
              )}
            </div>

            {/* Timeline */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase text-ink-muted">Fulfillment Timeline</p>
              <OrderTimeline status={orderDetail.status} history={orderDetail.statusHistory} />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

