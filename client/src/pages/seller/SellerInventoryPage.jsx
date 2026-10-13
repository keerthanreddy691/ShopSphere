import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Boxes, Search, Edit3, History, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { get, patch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, Field } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { TableWrap, Table, THead, TH, TBody, TR, TD } from '@/components/ui/table';
import { Dialog } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { SafeImage } from '@/components/common/SafeImage';
import { formatDateTime } from '@/lib/format';

export default function SellerInventoryPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Edit stock dialog
  const [editingProduct, setEditingProduct] = useState(null);
  const [newStock, setNewStock] = useState('');
  const [newThreshold, setNewThreshold] = useState('');
  const [reason, setReason] = useState('Restock / Manual adjustment');

  // History dialog
  const [historyProduct, setHistoryProduct] = useState(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['seller-inventory', { search, lowStockOnly }],
    queryFn: () => get('/inventory', { search, lowStock: lowStockOnly ? 'true' : 'false' }).then((d) => d.items),
  });

  const { data: movementHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ['inventory-history', historyProduct?._id],
    queryFn: () => get(`/inventory/${historyProduct._id}/history`).then((d) => d.history),
    enabled: Boolean(historyProduct),
  });

  const updateStock = useMutation({
    mutationFn: () =>
      patch(`/inventory/${editingProduct._id}`, {
        stock: Number(newStock),
        lowStockThreshold: Number(newThreshold) || 5,
        reason,
      }),
    onSuccess: () => {
      toast.success('Inventory updated successfully');
      setEditingProduct(null);
      qc.invalidateQueries({ queryKey: ['seller-inventory'] });
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

  const items = data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <p className="mt-1 text-sm text-ink-muted">Monitor stock levels, reorder alerts, and audit inventory movements.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search SKU or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <button
          onClick={() => setLowStockOnly(!lowStockOnly)}
          className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
            lowStockOnly
              ? 'border-amber-400 bg-amber-50 text-amber-800'
              : 'border-slate-200 bg-white text-ink-muted hover:border-slate-300'
          }`}
        >
          <AlertTriangle className="size-4" /> Only Low Stock Items
        </button>
      </div>

      {!items.length ? (
        <Card>
          <EmptyState
            icon={Boxes}
            title={search || lowStockOnly ? 'No matching inventory items' : 'No products in inventory'}
            description="Add products to your store to start tracking inventory."
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
                  <TH>Available Stock</TH>
                  <TH>Low Stock Alert</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {items.map((it) => {
                  const isLow = it.stock <= (it.lowStockThreshold || 5);
                  return (
                    <TR key={it._id}>
                      <TD>
                        <div className="flex items-center gap-3">
                          <SafeImage src={it.images?.[0]} alt="" className="size-10 rounded-lg object-cover" />
                          <div className="min-w-0">
                            <p className="font-semibold text-ink line-clamp-1">{it.name}</p>
                            <p className="text-xs text-ink-muted">{it.soldCount || 0} units sold</p>
                          </div>
                        </div>
                      </TD>
                      <TD className="font-mono text-xs text-ink-muted">{it.sku || '—'}</TD>
                      <TD>
                        <span className={`text-sm font-bold ${isLow ? 'text-amber-600' : 'text-emerald-700'}`}>
                          {it.stock} units
                        </span>
                      </TD>
                      <TD className="text-xs text-ink-muted">Threshold: {it.lowStockThreshold || 5}</TD>
                      <TD>
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                            <AlertTriangle className="size-3.5" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                            <CheckCircle2 className="size-3.5" /> Healthy
                          </span>
                        )}
                      </TD>
                      <TD className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1 text-xs"
                            onClick={() => {
                              setEditingProduct(it);
                              setNewStock(String(it.stock));
                              setNewThreshold(String(it.lowStockThreshold || 5));
                            }}
                          >
                            <Edit3 className="size-3.5" /> Adjust
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1 text-xs"
                            onClick={() => setHistoryProduct(it)}
                          >
                            <History className="size-3.5" /> History
                          </Button>
                        </div>
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </TableWrap>
        </Card>
      )}

      {/* Adjust Stock Dialog */}
      <Dialog
        open={Boolean(editingProduct)}
        onClose={() => setEditingProduct(null)}
        title={`Adjust Stock — ${editingProduct?.name}`}
        description="Update the available inventory count for this product. All changes are logged for auditing."
        footer={
          <>
            <Button variant="outline" onClick={() => setEditingProduct(null)}>
              Cancel
            </Button>
            <Button loading={updateStock.isPending} onClick={() => updateStock.mutate()}>
              Save Stock
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Current Stock Count" required>
            <Input
              type="number"
              min="0"
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
              required
            />
          </Field>
          <Field label="Low Stock Alert Threshold" hint="Triggers low stock alert when stock reaches this level">
            <Input
              type="number"
              min="1"
              value={newThreshold}
              onChange={(e) => setNewThreshold(e.target.value)}
            />
          </Field>
          <Field label="Adjustment Reason" hint="e.g. Supplier delivery, inventory count check">
            <Input
              placeholder="e.g. Restocked 20 units from factory"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </Field>
        </div>
      </Dialog>

      {/* History Dialog */}
      <Dialog
        open={Boolean(historyProduct)}
        onClose={() => setHistoryProduct(null)}
        size="lg"
        title={`Stock Movements — ${historyProduct?.name}`}
        description="Chronological log of stock increments, decrements, orders, and adjustments."
      >
        {loadingHistory ? (
          <div className="space-y-2 py-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 rounded-lg" />
            ))}
          </div>
        ) : !movementHistory?.length ? (
          <p className="py-6 text-center text-sm text-ink-muted">No past stock movements recorded.</p>
        ) : (
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {movementHistory.map((m) => (
              <div key={m._id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs uppercase tracking-wider text-slate-700">
                      {m.type}
                    </span>
                    <span className="text-xs text-ink-muted">
                      {m.order?.orderNumber ? `Order #${m.order.orderNumber}` : m.reason}
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-muted">{formatDateTime(m.createdAt)}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`font-mono text-sm font-bold ${
                      m.quantity > 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </span>
                  {m.stockAfter !== undefined && (
                    <p className="text-[11px] text-ink-muted">Balance: {m.stockAfter}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Dialog>
    </div>
  );
}

