import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Store,
  ShoppingBag,
  IndianRupee,
  BadgePercent,
  Clock,
  ShieldAlert,
  LifeBuoy,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { get } from '@/lib/api';
import { KpiCard } from '@/components/common/KpiCard';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ErrorState } from '@/components/common/ErrorState';
import { formatPrice, formatDateTime } from '@/lib/format';

export default function AdminOverviewPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => get('/admin/overview'),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  const trend = data?.salesTrend || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Control Center</h1>
        <p className="mt-1 text-sm text-ink-muted">High-level marketplace health, financial performance, and moderation queues.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Gross GMV"
          value={formatPrice(data.gmv)}
          hint="Gross merchandise value"
          icon={IndianRupee}
          tone="brand"
        />
        <KpiCard
          label="Platform Revenue (5%)"
          value={formatPrice(data.platformRevenue)}
          hint="Commission earned"
          icon={BadgePercent}
          tone="green"
        />
        <KpiCard
          label="Total Orders"
          value={data.totalOrders}
          hint={`${data.orderStatuses?.DELIVERED || 0} delivered`}
          icon={ShoppingBag}
          tone="sky"
        />
        <KpiCard
          label="Total Registered Users"
          value={data.totalUsers}
          hint={`${data.userRoles?.CUSTOMER || 0} customers`}
          icon={Users}
          tone="violet"
        />
        <KpiCard
          label="Pending Seller Approvals"
          value={data.pendingSellerApprovals}
          hint="Awaiting business review"
          icon={Store}
          tone={data.pendingSellerApprovals > 0 ? 'orange' : 'brand'}
        />
        <KpiCard
          label="Pending Product Moderation"
          value={data.pendingProductModeration}
          hint="Submissions queued"
          icon={ShieldAlert}
          tone={data.pendingProductModeration > 0 ? 'amber' : 'brand'}
        />
        <KpiCard
          label="Open Support Tickets"
          value={data.openTickets}
          hint="Unresolved inquiries"
          icon={LifeBuoy}
          tone={data.openTickets > 0 ? 'red' : 'brand'}
        />
        <KpiCard
          label="Active Sellers"
          value={data.sellerStatuses?.APPROVED || 0}
          hint="Approved marketplace stores"
          icon={Store}
          tone="green"
        />
      </div>

      {/* GMV & Revenue Curve */}
      <Card className="p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <TrendingUp className="size-5 text-brand-600" /> Platform GMV & Revenue Trend (7 Days)
            </h2>
            <p className="text-xs text-ink-muted">Daily platform transaction volume</p>
          </div>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gmvGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0f172a" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0f172a" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} stroke="#cbd5e1" />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} stroke="#cbd5e1" tickFormatter={(v) => `₹${v}`} />
              <Tooltip
                formatter={(val, name) => [formatPrice(val), name === 'gmv' ? 'Gross GMV' : 'Revenue']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
              />
              <Area type="monotone" dataKey="gmv" stroke="#0f172a" strokeWidth={2.5} fillOpacity={1} fill="url(#gmvGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Recent Platform Orders */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-4">
          <h2 className="text-base font-semibold">Recent Platform Transactions</h2>
          <Link to="/admin/orders" className="text-xs font-semibold text-brand-600 hover:underline">
            View all orders →
          </Link>
        </div>

        {!data.recentOrders?.length ? (
          <p className="p-8 text-center text-sm text-ink-muted">No orders in database.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.recentOrders.map((o) => (
              <div key={o._id} className="flex flex-wrap items-center justify-between gap-4 p-4 transition hover:bg-slate-50 sm:px-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-ink">{o.orderNumber}</span>
                    <StatusBadge status={o.status} />
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">
                    Buyer: {o.customer?.name} · Store: {o.store?.name} · {formatDateTime(o.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatPrice(o.total)}</p>
                    <p className="text-[11px] text-ink-muted">Fee: {formatPrice(o.platformFee)}</p>
                  </div>
                  <Link to="/admin/orders">
                    <Button variant="outline" size="sm">
                      Details <ArrowRight className="size-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

