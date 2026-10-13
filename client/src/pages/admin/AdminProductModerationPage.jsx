import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Search, CheckCircle2, XCircle, Star, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
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
import { SafeImage } from '@/components/common/SafeImage';
import { formatPrice, formatDateTime } from '@/lib/format';

const TABS = [
  { value: '', label: 'All Products' },
  { value: 'PENDING', label: 'Pending Review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

export default function AdminProductModerationPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('PENDING');
  const [search, setSearch] = useState('');

  // Reject Dialog
  const [rejectId, setRejectId] = useState(null);
  const [rejectNote, setRejectNote] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-products', { page, status, search }],
    queryFn: () => get('/admin/products', { page, limit: 15, moderationStatus: status, q: search }),
  });

  const moderateMutation = useMutation({
    mutationFn: ({ id, nextStatus, note }) =>
      patch(`/admin/products/${id}/moderate`, { status: nextStatus, note }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Product moderation updated');
      setRejectId(null);
      setRejectNote('');
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      qc.invalidateQueries({ queryKey: ['admin-overview'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleFeatured = useMutation({
    mutationFn: (id) => patch(`/admin/products/${id}/feature`),
    onSuccess: (res) => {
      toast.success(res?.message || 'Featured state updated');
      qc.invalidateQueries({ queryKey: ['admin-products'] });
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

  const products = data?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Catalog Moderation</h1>
          <p className="mt-1 text-sm text-ink-muted">Inspect seller product submissions to maintain quality and catalog standards.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search product or brand..."
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

      {!products.length ? (
        <Card>
          <EmptyState
            icon={ShieldCheck}
            title={status ? 'No products in this queue' : 'No products found'}
            description="Submitted products requiring review will appear here."
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <TableWrap>
            <Table>
              <THead>
                <TR>
                  <TH>Product</TH>
                  <TH>Store</TH>
                  <TH>Category</TH>
                  <TH>Price</TH>
                  <TH>Submitted</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {products.map((p) => (
                  <TR key={p._id}>
                    <TD>
                      <div className="flex items-center gap-3">
                        <SafeImage src={p.images?.[0]} alt="" className="size-12 rounded-lg object-cover" />
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-ink line-clamp-1">{p.name}</p>
                          <p className="text-xs text-ink-muted">{p.brand || 'Generic'}</p>
                        </div>
                      </div>
                    </TD>
                    <TD className="text-xs font-medium text-ink-soft">{p.store?.name || 'Seller'}</TD>
                    <TD className="text-xs text-ink-muted">{p.category?.name || '—'}</TD>
                    <TD className="text-sm font-bold">{formatPrice(p.finalPrice || p.price)}</TD>
                    <TD className="text-xs text-ink-muted">{formatDateTime(p.createdAt)}</TD>
                    <TD>
                      <StatusBadge status={p.moderationStatus} />
                    </TD>
                    <TD className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title={p.isFeatured ? 'Unfeature Product' : 'Feature Product'}
                          onClick={() => toggleFeatured.mutate(p._id)}
                          className={p.isFeatured ? 'text-amber-500' : 'text-slate-400'}
                        >
                          <Star className={`size-4 ${p.isFeatured ? 'fill-amber-400' : ''}`} />
                        </Button>

                        {p.moderationStatus === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-700 text-xs"
                              loading={moderateMutation.isPending}
                              onClick={() =>
                                moderateMutation.mutate({ id: p._id, nextStatus: 'APPROVED', note: '' })
                              }
                            >
                              <CheckCircle2 className="size-3.5" /> Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1 text-red-600 hover:bg-red-50 text-xs"
                              onClick={() => setRejectId(p._id)}
                            >
                              <XCircle className="size-3.5" /> Reject
                            </Button>
                          </>
                        )}

                        {p.moderationStatus === 'APPROVED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs text-red-600 hover:bg-red-50"
                            onClick={() => setRejectId(p._id)}
                          >
                            Delist
                          </Button>
                        )}

                        {p.moderationStatus === 'REJECTED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs text-emerald-600 hover:bg-emerald-50"
                            onClick={() =>
                              moderateMutation.mutate({ id: p._id, nextStatus: 'APPROVED', note: '' })
                            }
                          >
                            Approve
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

      {/* Reject Modal */}
      <Dialog
        open={Boolean(rejectId)}
        onClose={() => setRejectId(null)}
        title="Reject / Delist Product"
        description="Explain why this product does not comply with marketplace standards. The seller will see this note."
        footer={
          <>
            <Button variant="outline" onClick={() => setRejectId(null)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              loading={moderateMutation.isPending}
              onClick={() =>
                moderateMutation.mutate({
                  id: rejectId,
                  nextStatus: 'REJECTED',
                  note: rejectNote,
                })
              }
              disabled={!rejectNote.trim()}
            >
              Confirm Rejection
            </Button>
          </>
        }
      >
        <Field label="Rejection Note / Reason" required>
          <Input
            placeholder="e.g. Inappropriate images, prohibited item, or misleading pricing"
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
          />
        </Field>
      </Dialog>
    </div>
  );
}

