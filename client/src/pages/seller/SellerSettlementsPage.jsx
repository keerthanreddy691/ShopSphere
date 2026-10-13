import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BadgePercent, IndianRupee, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { get } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs } from '@/components/ui/tabs';
import { TableWrap, Table, THead, TH, TBody, TR, TD } from '@/components/ui/table';
import { StatusBadge } from '@/components/common/StatusBadge';
import { KpiCard } from '@/components/common/KpiCard';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Pagination } from '@/components/common/Pagination';
import { formatPrice, formatDateTime } from '@/lib/format';

const TABS = [
  { value: '', label: 'All Settlements' },
  { value: 'PENDING', label: 'Pending Payout' },
  { value: 'PROCESSED', label: 'Processed' },
  { value: 'ON_HOLD', label: 'On Hold' },
];

export default function SellerSettlementsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['seller-settlements', { page, status }],
    queryFn: () => get('/settlements', { page, limit: 15, status }),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  const items = data?.items || [];
  const summary = data?.summary || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Seller Settlements</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Track payouts generated from delivered orders. Platform fee of 5% is deducted per marketplace policy.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Gross Delivered Sales"
          value={formatPrice(summary.totalGross || 0)}
          hint="Total value of orders delivered"
          icon={IndianRupee}
          tone="brand"
        />
        <KpiCard
          label="Platform Commission (5%)"
          value={formatPrice(summary.totalFees || 0)}
          hint="ShopSphere service charge"
          icon={BadgePercent}
          tone="orange"
        />
        <KpiCard
          label="Processed Payouts"
          value={formatPrice(summary.PROCESSED || 0)}
          hint="Deposited to your account"
          icon={CheckCircle2}
          tone="green"
        />
        <KpiCard
          label="Pending Payouts"
          value={formatPrice(summary.PENDING || 0)}
          hint="In payout pipeline"
          icon={Clock}
          tone="violet"
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

      {!items.length ? (
        <Card>
          <EmptyState
            icon={BadgePercent}
            title={status ? 'No settlements in this status' : 'No settlement records yet'}
            description="Settlement entries are automatically generated when orders reach 'Delivered' status."
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <TableWrap>
            <Table>
              <THead>
                <TR>
                  <TH>Order Number</TH>
                  <TH>Gross Total</TH>
                  <TH>Platform Fee (5%)</TH>
                  <TH>Refund Adj.</TH>
                  <TH>Net Seller Amount</TH>
                  <TH>Status</TH>
                  <TH>Settlement Date</TH>
                </TR>
              </THead>
              <TBody>
                {items.map((s) => (
                  <TR key={s._id}>
                    <TD className="font-mono text-sm font-bold text-ink">
                      {s.order?.orderNumber || '—'}
                    </TD>
                    <TD className="text-sm font-semibold">{formatPrice(s.grossAmount)}</TD>
                    <TD className="text-sm text-red-600">− {formatPrice(s.platformFee)}</TD>
                    <TD className="text-sm text-ink-muted">
                      {s.refundAdjustment > 0 ? `− ${formatPrice(s.refundAdjustment)}` : '—'}
                    </TD>
                    <TD className="text-base font-bold text-emerald-600">{formatPrice(s.netAmount)}</TD>
                    <TD>
                      <StatusBadge status={s.status} />
                    </TD>
                    <TD className="text-xs text-ink-muted">{formatDateTime(s.date || s.createdAt)}</TD>
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
    </div>
  );
}

