import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RotateCcw, Search, CheckCircle2, XCircle, PackageCheck, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';
import { get, patch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, Field } from '@/components/ui/input';
import { Tabs } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog } from '@/components/ui/dialog';
import { TableWrap, Table, THead, TH, TBody, TR, TD } from '@/components/ui/table';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Pagination } from '@/components/common/Pagination';
import { formatPrice, formatDateTime } from '@/lib/format';

const TABS = [
  { value: '', label: 'All Returns' },
  { value: 'REQUESTED', label: 'Requested' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'RECEIVED', label: 'Received' },
  { value: 'REFUNDED', label: 'Refunded' },
  { value: 'REJECTED', label: 'Rejected' },
];

export default function SellerReturnsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  // Reject modal
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['seller-returns', { page, status }],
    queryFn: () => get('/returns', { page, limit: 15, status }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, nextStatus, resolutionNote }) =>
      patch(`/returns/${id}/status`, { status: nextStatus, resolutionNote }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Return status updated');
      setRejectId(null);
      setRejectReason('');
      qc.invalidateQueries({ queryKey: ['seller-returns'] });
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

  const returns = data?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Returns & Refunds</h1>
          <p className="mt-1 text-sm text-ink-muted">Manage buyer return requests, accept shipments, and issue refunds.</p>
        </div>
      </div>

      <Tabs
        tabs={TABS}
        value={status}
        onChange={(v) => {
          setStatus(v);
          setPage(1);
        }}
      />

      {!returns.length ? (
        <Card>
          <EmptyState
            icon={RotateCcw}
            title={status ? 'No returns with this status' : 'No return requests'}
            description="Buyer return requests will be listed here for approval and refund processing."
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <TableWrap>
            <Table>
              <THead>
                <TR>
                  <TH>Return ID</TH>
                  <TH>Order</TH>
                  <TH>Customer</TH>
                  <TH>Reason</TH>
                  <TH>Refund Value</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Action</TH>
                </TR>
              </THead>
              <TBody>
                {returns.map((r) => (
                  <TR key={r._id}>
                    <TD className="font-mono text-sm font-bold text-ink">{r.returnNumber}</TD>
                    <TD className="font-mono text-xs text-ink-muted">{r.order?.orderNumber}</TD>
                    <TD>
                      <p className="font-semibold text-sm">{r.customer?.name}</p>
                      <p className="text-xs text-ink-muted">{r.customer?.phone}</p>
                    </TD>
                    <TD>
                      <p className="text-sm font-medium line-clamp-1">{r.reason}</p>
                      {r.description && <p className="text-xs text-ink-muted line-clamp-1">{r.description}</p>}
                    </TD>
                    <TD className="font-bold text-sm">{formatPrice(r.refundAmount)}</TD>
                    <TD>
                      <StatusBadge status={r.status} />
                    </TD>
                    <TD className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {r.status === 'REQUESTED' && (
                          <>
                            <Button
                              size="sm"
                              className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-700 text-xs"
                              onClick={() => updateStatus.mutate({ id: r._id, nextStatus: 'APPROVED' })}
                              loading={updateStatus.isPending}
                            >
                              <CheckCircle2 className="size-3.5" /> Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1 text-red-600 hover:bg-red-50 text-xs"
                              onClick={() => setRejectId(r._id)}
                            >
                              <XCircle className="size-3.5" /> Reject
                            </Button>
                          </>
                        )}
                        {r.status === 'APPROVED' && (
                          <Button
                            size="sm"
                            className="h-8 gap-1 text-xs"
                            onClick={() => updateStatus.mutate({ id: r._id, nextStatus: 'RECEIVED' })}
                            loading={updateStatus.isPending}
                          >
                            <PackageCheck className="size-3.5" /> Mark Received
                          </Button>
                        )}
                        {r.status === 'RECEIVED' && (
                          <Button
                            size="sm"
                            className="h-8 gap-1 bg-violet-600 hover:bg-violet-700 text-xs"
                            onClick={() => updateStatus.mutate({ id: r._id, nextStatus: 'REFUNDED' })}
                            loading={updateStatus.isPending}
                          >
                            <IndianRupee className="size-3.5" /> Issue Refund
                          </Button>
                        )}
                      </div>
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

      {/* Reject Dialog */}
      <Dialog
        open={Boolean(rejectId)}
        onClose={() => setRejectId(null)}
        title="Reject Return Request"
        description="Provide a clear explanation for declining this return request. The customer will be notified."
        footer={
          <>
            <Button variant="outline" onClick={() => setRejectId(null)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              loading={updateStatus.isPending}
              onClick={() =>
                updateStatus.mutate({
                  id: rejectId,
                  nextStatus: 'REJECTED',
                  resolutionNote: rejectReason,
                })
              }
              disabled={!rejectReason.trim()}
            >
              Confirm Rejection
            </Button>
          </>
        }
      >
        <Field label="Rejection Explanation" required>
          <Input
            placeholder="e.g. Return request is past the 7-day period or item was altered"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </Field>
      </Dialog>
    </div>
  );
}

