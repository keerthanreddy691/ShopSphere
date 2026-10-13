import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  ExternalLink,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { get, del } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { TableWrap, Table, THead, TH, TBody, TR, TD } from '@/components/ui/table';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Pagination } from '@/components/common/Pagination';
import { SafeImage } from '@/components/common/SafeImage';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { formatPrice } from '@/lib/format';

const TABS = [
  { value: '', label: 'All Products' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'PENDING', label: 'Pending Review' },
  { value: 'REJECTED', label: 'Rejected' },
];

export default function SellerProductsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['seller-products', { page, q, status }],
    queryFn: () => get('/products/seller/mine', { page, limit: 15, q, moderationStatus: status }),
  });

  const deleteProduct = useMutation({
    mutationFn: (id) => del(`/products/${id}`),
    onSuccess: (res) => {
      toast.success(res?.message || 'Product deleted');
      setDeleteId(null);
      qc.invalidateQueries({ queryKey: ['seller-products'] });
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

  const products = data?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Product Catalog</h1>
          <p className="mt-1 text-sm text-ink-muted">Manage your product listings, pricing, and approval statuses.</p>
        </div>
        <Link to="/seller/products/new">
          <Button className="gap-2">
            <Plus className="size-4" /> Add New Product
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search products..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
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
            icon={Package}
            title={q || status ? 'No products match filters' : 'No products listed yet'}
            description="Start listing items to begin receiving orders across India on ShopSphere."
            action={
              <Link to="/seller/products/new">
                <Button className="gap-2">
                  <Plus className="size-4" /> Add Your First Product
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <TableWrap>
            <Table>
              <THead>
                <TR>
                  <TH>Product</TH>
                  <TH>SKU</TH>
                  <TH>Price</TH>
                  <TH>Stock</TH>
                  <TH>Approval</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {products.map((p) => (
                  <TR key={p._id}>
                    <TD>
                      <div className="flex items-center gap-3">
                        <SafeImage
                          src={p.images?.[0]}
                          alt={p.name}
                          className="size-12 shrink-0 rounded-lg object-cover"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-ink line-clamp-1">{p.name}</p>
                          <p className="text-xs text-ink-muted">{p.category?.name || 'Category'}</p>
                        </div>
                      </div>
                    </TD>
                    <TD className="font-mono text-xs text-ink-muted">{p.sku || '—'}</TD>
                    <TD>
                      <div>
                        <span className="font-bold">{formatPrice(p.finalPrice || p.price)}</span>
                        {p.discount > 0 && (
                          <span className="ml-1 text-xs text-emerald-600 font-medium">({p.discount}% off)</span>
                        )}
                      </div>
                    </TD>
                    <TD>
                      <span
                        className={`font-semibold ${
                          p.stock <= (p.lowStockThreshold || 5) ? 'text-amber-600' : 'text-ink'
                        }`}
                      >
                        {p.stock} units
                      </span>
                    </TD>
                    <TD>
                      <StatusBadge status={p.moderationStatus} />
                    </TD>
                    <TD className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {p.moderationStatus === 'APPROVED' && (
                          <Link to={`/product/${p.slug}`} target="_blank">
                            <Button variant="ghost" size="icon-sm" aria-label="View Product">
                              <Eye className="size-4" />
                            </Button>
                          </Link>
                        )}
                        <Link to={`/seller/products/${p._id}/edit`}>
                          <Button variant="ghost" size="icon-sm" aria-label="Edit Product">
                            <Edit2 className="size-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          aria-label="Delete Product"
                          onClick={() => setDeleteId(p._id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
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

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteProduct.mutate(deleteId)}
        title="Delete Product"
        description="Are you sure you want to delete this product? If the product has past orders, it will be safely archived instead of permanently deleted."
        confirmText="Delete"
        danger
        loading={deleteProduct.isPending}
      />
    </div>
  );
}

