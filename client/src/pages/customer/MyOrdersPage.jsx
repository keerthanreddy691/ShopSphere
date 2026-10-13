import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, Store } from 'lucide-react';
import { useMyOrders } from '@/hooks/useOrders';
import { Card } from '@/components/ui/card';
import { Tabs } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Pagination } from '@/components/common/Pagination';
import { SafeImage } from '@/components/common/SafeImage';
import { formatDate, formatPrice } from '@/lib/format';

const TABS = [
  { value: '', label: 'All' },
  { value: 'PLACED', label: 'Placed' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'RETURN_REQUESTED', label: 'Returns' },
];

export default function MyOrdersPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useMyOrders({ status, page, limit: 10 });

  // Orders from one checkout are shown together as a single purchase.
  const groups = [];
  (data?.items || []).forEach((o) => {
    const last = groups[groups.length - 1];
    if (last && last.checkoutId === o.checkoutId) last.orders.push(o);
    else groups.push({ checkoutId: o.checkoutId, createdAt: o.createdAt, orders: [o] });
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">My orders</h1>
      <p className="mt-1 text-sm text-ink-muted">Track, cancel or return your purchases.</p>
      <Tabs className="mt-5" tabs={TABS} value={status} onChange={(v) => { setStatus(v); setPage(1); }} />
      <div className="mt-5 space-y-4">
        {isLoading ? (
          [1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-2xl" />)
        ) : isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : !groups.length ? (
          <Card><EmptyState icon={Package} title={status ? 'No orders in this status' : 'No orders yet'} description="When you place an order it will show up here." action={<Link to="/products"><Button>Start shopping</Button></Link>} /></Card>
        ) : (
          groups.map((g) => (
            <Card key={g.checkoutId} className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70 px-5 py-3 text-xs text-ink-muted">
                <span>Placed on <span className="font-semibold text-ink">{formatDate(g.createdAt)}</span></span>
                <Link to={`/order-success/${g.checkoutId}`} className="font-mono hover:text-brand-600">{g.checkoutId}</Link>
                <span>Total <span className="font-semibold text-ink">{formatPrice(g.orders.reduce((s, o) => s + o.total, 0))}</span></span>
              </div>
              <ul className="divide-y divide-slate-100">
                {g.orders.map((o) => (
                  <li key={o._id}>
                    <Link to={`/account/orders/${o._id}`} className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50/70">
                      <div className="flex -space-x-3">
                        {o.items.slice(0, 3).map((it) => <SafeImage key={it._id} src={it.image} alt="" className="size-14 rounded-xl border-2 border-white object-cover" />)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{o.items[0]?.name}{o.items.length > 1 ? ` + ${o.items.length - 1} more` : ''}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-muted"><Store className="size-3" /> {o.store?.name} · {o.orderNumber}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <StatusBadge status={o.status} />
                          <span className="text-sm font-semibold">{formatPrice(o.total)}</span>
                        </div>
                      </div>
                      <ChevronRight className="size-5 shrink-0 text-slate-300" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ))
        )}
      </div>
      <Pagination className="mt-6" page={page} pages={data?.pagination.pages} onChange={setPage} />
    </div>
  );
}
