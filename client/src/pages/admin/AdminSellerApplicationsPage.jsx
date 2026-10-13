import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Store, Search, CheckCircle2, XCircle, Phone, Mail, FileText } from 'lucide-react';
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
import { formatDateTime } from '@/lib/format';

const TABS = [
  { value: '', label: 'All Applicants' },
  { value: 'PENDING', label: 'Pending Review' },
  { value: 'APPROVED', label: 'Approved Sellers' },
  { value: 'REJECTED', label: 'Rejected' },
];

export default function AdminSellerApplicationsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  // Reject Dialog
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-sellers', { page, status, search }],
    queryFn: () => get('/sellers', { page, limit: 15, status, search }),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, nextStatus, reason }) =>
      patch(`/sellers/${id}/review`, { status: nextStatus, reason }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Seller status updated');
      setRejectId(null);
      setRejectReason('');
      qc.invalidateQueries({ queryKey: ['admin-sellers'] });
      qc.invalidateQueries({ queryKey: ['admin-overview'] });
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

  const sellers = data?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Seller Applications & Verification</h1>
          <p className="mt-1 text-sm text-ink-muted">Review onboarding applications, verify GSTIN credentials, and approve marketplace sellers.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search business name..."
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

      {!sellers.length ? (
        <Card>
          <EmptyState
            icon={Store}
            title={status || search ? 'No sellers match filter' : 'No seller applications registered'}
            description="When users sign up with a seller account, their applications will show up here."
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <TableWrap>
            <Table>
              <THead>
                <TR>
                  <TH>Business Name</TH>
                  <TH>GSTIN</TH>
                  <TH>Owner Contact</TH>
                  <TH>Applied Date</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {sellers.map((s) => (
                  <TR key={s._id}>
                    <TD>
                      <div>
                        <p className="font-bold text-sm text-ink">{s.businessName}</p>
                        {s.description && (
                          <p className="text-xs text-ink-muted line-clamp-1 max-w-xs">{s.description}</p>
                        )}
                      </div>
                    </TD>
                    <TD className="font-mono text-xs text-ink-muted">{s.gstin || 'Pending GSTIN'}</TD>
                    <TD>
                      <p className="text-sm font-semibold">{s.user?.name}</p>
                      <p className="text-xs text-ink-muted">{s.user?.email}</p>
                      {s.phone && <p className="text-xs text-ink-muted">{s.phone}</p>}
                    </TD>
                    <TD className="text-xs text-ink-muted">{formatDateTime(s.createdAt)}</TD>
                    <TD>
                      <StatusBadge status={s.status} />
                    </TD>
                    <TD className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {s.status === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-700 text-xs"
                              loading={reviewMutation.isPending}
                              onClick={() =>
                                reviewMutation.mutate({ id: s._id, nextStatus: 'APPROVED', reason: '' })
                              }
                            >
                              <CheckCircle2 className="size-3.5" /> Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1 text-red-600 hover:bg-red-50 text-xs"
                              onClick={() => setRejectId(s._id)}
                            >
                              <XCircle className="size-3.5" /> Reject
                            </Button>
                          </>
                        )}
                        {s.status === 'APPROVED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs text-red-600 hover:bg-red-50"
                            onClick={() => setRejectId(s._id)}
                          >
                            Suspend
                          </Button>
                        )}
                        {s.status === 'REJECTED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs text-emerald-600 hover:bg-emerald-50"
                            onClick={() =>
                              reviewMutation.mutate({ id: s._id, nextStatus: 'APPROVED', reason: '' })
                            }
                          >
                            Re-approve
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

      {/* Reject / Suspend Dialog */}
      <Dialog
        open={Boolean(rejectId)}
        onClose={() => setRejectId(null)}
        title="Decline / Suspend Seller"
        description="Provide a justification for declining this application or suspending the store."
        footer={
          <>
            <Button variant="outline" onClick={() => setRejectId(null)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              loading={reviewMutation.isPending}
              onClick={() =>
                reviewMutation.mutate({
                  id: rejectId,
                  nextStatus: 'REJECTED',
                  reason: rejectReason,
                })
              }
              disabled={!rejectReason.trim()}
            >
              Confirm
            </Button>
          </>
        }
      >
        <Field label="Reason / Notes" required>
          <Input
            placeholder="e.g. Invalid GSTIN or business registration could not be verified"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </Field>
      </Dialog>
    </div>
  );
}

