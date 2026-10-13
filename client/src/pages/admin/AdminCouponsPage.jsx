import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag, Plus, Edit2, Trash2, CheckCircle2, TicketPercent } from 'lucide-react';
import { toast } from 'sonner';
import { get, post, patch, del } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, Field, Select, Checkbox } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog } from '@/components/ui/dialog';
import { TableWrap, Table, THead, TH, TBody, TR, TD } from '@/components/ui/table';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { formatPrice, formatDate } from '@/lib/format';

export default function AdminCouponsPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Form State
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('PERCENTAGE');
  const [value, setValue] = useState('');
  const [minOrder, setMinOrder] = useState('0');
  const [maxDiscount, setMaxDiscount] = useState('0');
  const [expiresAt, setExpiresAt] = useState('');
  const [usageLimit, setUsageLimit] = useState('0');
  const [perUserLimit, setPerUserLimit] = useState('1');
  const [isActive, setIsActive] = useState(true);

  const { data: coupons = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => get('/coupons').then((d) => d.coupons),
  });

  const openCreate = () => {
    setEditingCoupon(null);
    setCode('');
    setDescription('');
    setType('PERCENTAGE');
    setValue('10');
    setMinOrder('499');
    setMaxDiscount('200');
    // Default 30 days ahead
    const d = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    setExpiresAt(d);
    setUsageLimit('0');
    setPerUserLimit('1');
    setIsActive(true);
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setEditingCoupon(c);
    setCode(c.code || '');
    setDescription(c.description || '');
    setType(c.type || 'PERCENTAGE');
    setValue(String(c.value || ''));
    setMinOrder(String(c.minOrder || '0'));
    setMaxDiscount(String(c.maxDiscount || '0'));
    setExpiresAt(c.expiresAt ? new Date(c.expiresAt).toISOString().split('T')[0] : '');
    setUsageLimit(String(c.usageLimit || '0'));
    setPerUserLimit(String(c.perUserLimit || '1'));
    setIsActive(Boolean(c.isActive));
    setModalOpen(true);
  };

  const saveCoupon = useMutation({
    mutationFn: () => {
      const payload = {
        code: code.trim().toUpperCase(),
        description: description.trim(),
        type,
        value: Number(value),
        minOrder: Number(minOrder) || 0,
        maxDiscount: Number(maxDiscount) || 0,
        expiresAt: new Date(expiresAt),
        usageLimit: Number(usageLimit) || 0,
        perUserLimit: Number(perUserLimit) || 1,
        isActive,
      };
      return editingCoupon
        ? patch(`/coupons/${editingCoupon._id}`, payload)
        : post('/coupons', payload);
    },
    onSuccess: (res) => {
      toast.success(res?.message || 'Coupon saved successfully');
      setModalOpen(false);
      qc.invalidateQueries({ queryKey: ['admin-coupons'] });
      qc.invalidateQueries({ queryKey: ['coupons-available'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, active }) => patch(`/coupons/${id}`, { isActive: active }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Coupon status updated');
      qc.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteCoupon = useMutation({
    mutationFn: (id) => del(`/coupons/${id}`),
    onSuccess: (res) => {
      toast.success(res?.message || 'Coupon deleted');
      setDeleteId(null);
      qc.invalidateQueries({ queryKey: ['admin-coupons'] });
      qc.invalidateQueries({ queryKey: ['coupons-available'] });
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Coupon & Promotional Campaigns</h1>
          <p className="mt-1 text-sm text-ink-muted">Create marketplace voucher codes, set minimum baskets, and cap discounts.</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="size-4" /> Create Coupon
        </Button>
      </div>

      {!coupons.length ? (
        <Card>
          <EmptyState
            icon={TicketPercent}
            title="No promotional coupons active"
            description="Create coupons to incentivize checkout across the marketplace."
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <TableWrap>
            <Table>
              <THead>
                <TR>
                  <TH>Code</TH>
                  <TH>Type & Value</TH>
                  <TH>Min Order</TH>
                  <TH>Max Discount</TH>
                  <TH>Usage</TH>
                  <TH>Expires</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {coupons.map((c) => (
                  <TR key={c._id}>
                    <TD>
                      <div>
                        <span className="font-mono font-bold text-sm text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                          {c.code}
                        </span>
                        {c.description && (
                          <p className="mt-1 text-xs text-ink-muted max-w-xs truncate">{c.description}</p>
                        )}
                      </div>
                    </TD>
                    <TD className="text-xs font-semibold">
                      {c.type === 'PERCENTAGE' ? `${c.value}% OFF` : `₹${c.value} OFF`}
                    </TD>
                    <TD className="text-xs text-ink-muted">{formatPrice(c.minOrder)}</TD>
                    <TD className="text-xs text-ink-muted">
                      {c.maxDiscount ? formatPrice(c.maxDiscount) : 'No cap'}
                    </TD>
                    <TD className="text-xs text-ink-muted">
                      {c.usedCount || 0} {c.usageLimit > 0 ? `/ ${c.usageLimit}` : 'uses'}
                    </TD>
                    <TD className="text-xs text-ink-muted">{formatDate(c.expiresAt)}</TD>
                    <TD>
                      <StatusBadge status={c.isActive ? 'ACTIVE' : 'INACTIVE'} />
                    </TD>
                    <TD className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Edit Coupon"
                          onClick={() => openEdit(c)}
                        >
                          <Edit2 className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => toggleStatus.mutate({ id: c._id, active: !c.isActive })}
                        >
                          {c.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          aria-label="Delete Coupon"
                          onClick={() => setDeleteId(c._id)}
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
        </Card>
      )}

      {/* Save Modal */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCoupon ? 'Edit Coupon' : 'Create Promotional Coupon'}
        description="Configure discount percentage, order thresholds, and expiry limits."
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={saveCoupon.isPending}
              onClick={() => saveCoupon.mutate()}
              disabled={!code || !value || !expiresAt}
            >
              {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Coupon Code" required>
              <Input
                placeholder="e.g. WELCOME10"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="font-mono uppercase"
                required
              />
            </Field>

            <Field label="Discount Type" required>
              <Select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₹)</option>
              </Select>
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label={type === 'PERCENTAGE' ? 'Discount %' : 'Amount (₹)'} required>
              <Input
                type="number"
                min="1"
                max={type === 'PERCENTAGE' ? 90 : 50000}
                placeholder={type === 'PERCENTAGE' ? '10' : '200'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
              />
            </Field>

            <Field label="Min Order Amount (₹)" hint="0 = no minimum">
              <Input
                type="number"
                min="0"
                placeholder="499"
                value={minOrder}
                onChange={(e) => setMinOrder(e.target.value)}
              />
            </Field>

            <Field label="Max Cap (₹)" hint="0 = no cap">
              <Input
                type="number"
                min="0"
                placeholder="200"
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(e.target.value)}
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Expiry Date" required>
              <Input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                required
              />
            </Field>

            <Field label="Global Usage Limit" hint="0 = unlimited">
              <Input
                type="number"
                min="0"
                placeholder="100"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Description (shown in checkout banner)">
            <Input
              placeholder="e.g. 10% off up to ₹200 on orders above ₹499"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>

          <div className="pt-2">
            <Checkbox
              label="Enable coupon immediately upon creation"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteCoupon.mutate(deleteId)}
        title="Delete Coupon"
        description="Are you sure you want to delete this coupon? Users will no longer be able to apply it at checkout."
        confirmText="Delete"
        danger
        loading={deleteCoupon.isPending}
      />
    </div>
  );
}

