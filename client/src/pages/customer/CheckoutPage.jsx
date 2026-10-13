import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MapPin, Tag, CreditCard, Smartphone, Landmark, Banknote, Store, CheckCircle2, XCircle, Loader2, Lock, X, TicketPercent } from 'lucide-react';
import { toast } from 'sonner';
import { get, post } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, Field, Checkbox } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { SafeImage } from '@/components/common/SafeImage';
import { OrderSummaryCard } from './CartPage';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';

const addressSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required'),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  line1: z.string().trim().min(3, 'House / street is required'),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(2, 'City is required'),
  state: z.string().trim().min(2, 'State is required'),
  pincode: z.string().trim().regex(/^\d{6}$/, 'Enter a valid 6-digit PIN code'),
});

const METHODS = [
  ['UPI', 'UPI', 'Google Pay, PhonePe, Paytm', Smartphone],
  ['CARD', 'Credit / Debit card', 'Visa, Mastercard, RuPay', CreditCard],
  ['NETBANKING', 'Net banking', 'All major Indian banks', Landmark],
  ['COD', 'Cash on delivery', 'Pay when your order arrives', Banknote],
];

function Step({ n, title, icon: Icon, children }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex size-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">{n}</span>
        <h2 className="flex items-center gap-2 text-lg font-semibold"><Icon className="size-5 text-brand-600" /> {title}</h2>
      </div>
      {children}
    </Card>
  );
}

function PaymentDialog({ state, onClose, onRetry, amount, method }) {
  return (
    <Dialog open={Boolean(state)} onClose={state === 'processing' ? undefined : onClose} size="sm">
      <div className="flex flex-col items-center py-6 text-center">
        {state === 'processing' && (
          <>
            <div className="relative">
              <Loader2 className="size-14 animate-spin text-brand-600" strokeWidth={1.5} />
              <Lock className="absolute inset-0 m-auto size-5 text-brand-700" />
            </div>
            <p className="mt-5 text-lg font-semibold">Processing payment…</p>
            <p className="mt-1 text-sm text-ink-muted">{method === 'COD' ? 'Confirming your cash-on-delivery order' : `Charging ${formatPrice(amount)} securely. Please don't close this window.`}</p>
          </>
        )}
        {state === 'success' && (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
            <CheckCircle2 className="size-16 text-emerald-500" />
            <p className="mt-4 text-lg font-semibold">Payment successful</p>
            <p className="mt-1 text-sm text-ink-muted">Creating your orders…</p>
          </motion.div>
        )}
        {state?.error && (
          <>
            <XCircle className="size-16 text-red-500" />
            <p className="mt-4 text-lg font-semibold">Payment failed</p>
            <p className="mt-1 text-sm text-ink-muted">{state.error}</p>
            <div className="mt-6 flex gap-2">
              <Button variant="outline" onClick={onClose}>Change method</Button>
              <Button onClick={onRetry}>Try again</Button>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}

export default function CheckoutPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState('');
  const [method, setMethod] = useState('UPI');
  const [saveAddress, setSaveAddress] = useState(true);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [payState, setPayState] = useState(null);

  const { register, handleSubmit, reset, getValues, formState: { errors } } = useForm({ resolver: zodResolver(addressSchema) });
  useEffect(() => {
    const a = user?.address || {};
    reset({ fullName: a.fullName || user?.name || '', phone: a.phone || user?.phone || '', line1: a.line1 || '', line2: a.line2 || '', city: a.city || '', state: a.state || '', pincode: a.pincode || '' });
  }, [user, reset]);

  const { data: preview, isLoading, isFetching } = useQuery({
    queryKey: ['checkout-preview', coupon],
    queryFn: () => post('/orders/checkout/preview', { couponCode: coupon }).then((r) => r.data),
  });
  const { data: coupons = [] } = useQuery({ queryKey: ['coupons-available'], queryFn: () => get('/coupons/available').then((d) => d.coupons) });

  useEffect(() => {
    if (!preview || !coupon) return;
    if (preview.couponError) {
      toast.error(preview.couponError);
      setCoupon('');
    } else if (preview.coupon) {
      toast.success(`${preview.coupon.code} applied — you save ${formatPrice(preview.summary.couponDiscount)}`);
    }
  }, [preview, coupon]);

  const place = useMutation({
    mutationFn: ({ address, fail }) => post('/orders/checkout', { shippingAddress: address, couponCode: coupon, paymentMethod: method, simulateFailure: method !== 'COD' && fail, saveAddress }),
    onMutate: () => setPayState('processing'),
    onSuccess: (res) => {
      setPayState('success');
      qc.setQueryData(['cart'], { items: [], groups: [], summary: { itemCount: 0 } });
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['me'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      setTimeout(() => navigate(`/order-success/${res.data.checkoutId}`, { replace: true }), 900);
    },
    onError: (e) => {
      if (e.status === 402) setPayState({ error: e.message });
      else {
        setPayState(null);
        toast.error(e.message);
        if (e.status === 409) qc.invalidateQueries({ queryKey: ['checkout-preview'] });
      }
    },
  });

  if (isLoading) {
    return (
      <div className="container grid gap-6 py-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}</div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }
  if (!preview?.items?.length && !place.isSuccess && !payState) return <Navigate to="/cart" replace />;

  const submit = handleSubmit((address) => place.mutate({ address, fail: simulateFailure }), () => {
    toast.error('Please complete your delivery address');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  return (
    <div className="container py-6 pb-28 sm:py-8 lg:pb-8">
      <h1 className="text-2xl font-bold sm:text-3xl">Checkout</h1>
      <p className="mt-1 text-sm text-ink-muted">One payment for {preview.groups.length} seller{preview.groups.length > 1 ? 's' : ''}. We'll split it into separate orders automatically.</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <Step n={1} title="Delivery address" icon={MapPin}>
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()} noValidate>
              <Field label="Full name" error={errors.fullName?.message} required><Input invalid={!!errors.fullName} {...register('fullName')} /></Field>
              <Field label="Mobile number" error={errors.phone?.message} required><Input inputMode="numeric" invalid={!!errors.phone} {...register('phone')} /></Field>
              <Field label="House no., building, street" error={errors.line1?.message} required className="sm:col-span-2"><Input invalid={!!errors.line1} {...register('line1')} /></Field>
              <Field label="Area, landmark" className="sm:col-span-2"><Input {...register('line2')} /></Field>
              <Field label="City" error={errors.city?.message} required><Input invalid={!!errors.city} {...register('city')} /></Field>
              <Field label="State" error={errors.state?.message} required><Input invalid={!!errors.state} {...register('state')} /></Field>
              <Field label="PIN code" error={errors.pincode?.message} required><Input inputMode="numeric" maxLength={6} invalid={!!errors.pincode} {...register('pincode')} /></Field>
              <div className="flex items-end pb-2"><Checkbox label="Save as my default address" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} /></div>
            </form>
          </Step>

          <Step n={2} title="Review items" icon={Store}>
            <div className="space-y-4">
              {preview.groups.map((g, i) => (
                <div key={g.seller._id} className="rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-2.5 text-sm">
                    <span className="font-semibold">Order {i + 1} · {g.store?.name}</span>
                    <span className="text-ink-muted">{formatPrice(g.total)}</span>
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {g.items.map((it) => (
                      <li key={it._id} className="flex items-center gap-3 px-4 py-3">
                        <SafeImage src={it.product.image} alt="" className="size-12 rounded-lg object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{it.product.name}</p>
                          <p className="text-xs text-ink-muted">{it.variantLabel ? `${it.variantLabel} · ` : ''}Qty {it.quantity}</p>
                        </div>
                        <p className="text-sm font-semibold">{formatPrice(it.lineTotal)}</p>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 px-4 py-2 text-xs text-ink-muted">
                    <span>Delivery: {g.shippingFee ? formatPrice(g.shippingFee) : 'Free'}</span>
                    {g.discount > 0 && <span className="text-emerald-600">Coupon share: −{formatPrice(g.discount)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </Step>

          <Step n={3} title="Payment method" icon={CreditCard}>
            <div className="grid gap-3 sm:grid-cols-2">
              {METHODS.map(([value, label, hint, Icon]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMethod(value)}
                  className={cn('flex items-center gap-3 rounded-xl border p-4 text-left transition', method === value ? 'border-brand-500 bg-brand-50/60 ring-2 ring-brand-100' : 'border-slate-200 hover:border-slate-300')}
                >
                  <span className={cn('flex size-10 items-center justify-center rounded-lg', method === value ? 'bg-brand-600 text-white' : 'bg-slate-100 text-ink-soft')}><Icon className="size-5" /></span>
                  <span>
                    <span className="block text-sm font-semibold">{label}</span>
                    <span className="block text-xs text-ink-muted">{hint}</span>
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-ink-muted">
              <p><span className="font-semibold text-ink-soft">Demo payment gateway.</span> No real money is charged. Payments are simulated so the full order flow can be demonstrated.</p>
              {method !== 'COD' && <Checkbox className="mt-2 text-xs" label="Simulate a declined payment" checked={simulateFailure} onChange={(e) => setSimulateFailure(e.target.checked)} />}
            </div>
          </Step>
        </div>

        <div className="space-y-4 lg:sticky lg:top-36 lg:self-start">
          <Card className="p-5">
            <p className="flex items-center gap-2 text-sm font-semibold"><Tag className="size-4 text-brand-600" /> Apply coupon</p>
            {preview.coupon ? (
              <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                <div>
                  <p className="font-mono text-sm font-bold text-emerald-700">{preview.coupon.code}</p>
                  <p className="text-xs text-emerald-700">You save {formatPrice(preview.summary.couponDiscount)}</p>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => { setCoupon(''); setCouponInput(''); }} aria-label="Remove coupon"><X /></Button>
              </div>
            ) : (
              <>
                <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (couponInput.trim()) setCoupon(couponInput.trim().toUpperCase()); }}>
                  <Input placeholder="Enter coupon code" value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} className="font-mono uppercase" aria-label="Coupon code" />
                  <Button type="submit" variant="outline" loading={isFetching && Boolean(coupon)}>Apply</Button>
                </form>
                {coupons.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {coupons.map((c) => (
                      <button key={c.code} type="button" onClick={() => { setCouponInput(c.code); setCoupon(c.code); }} className="flex w-full items-start gap-2.5 rounded-lg border border-dashed border-slate-300 p-2.5 text-left transition hover:border-brand-300 hover:bg-brand-50/40">
                        <TicketPercent className="mt-0.5 size-4 shrink-0 text-brand-600" />
                        <span>
                          <span className="block font-mono text-xs font-bold">{c.code}</span>
                          <span className="block text-xs text-ink-muted">{c.description}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </Card>
          <OrderSummaryCard summary={preview.summary} couponDiscount={preview.summary.couponDiscount}>
            <Button size="lg" className="mt-5 hidden w-full lg:flex" onClick={submit} loading={place.isPending} disabled={preview.summary.hasIssues}>
              <Lock /> {method === 'COD' ? 'Place order' : `Pay ${formatPrice(preview.summary.total)}`}
            </Button>
            {preview.summary.hasIssues && <p className="mt-3 text-xs text-amber-700">Some items are unavailable. <Link to="/cart" className="font-semibold underline">Review cart</Link></p>}
          </OrderSummaryCard>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-lg font-bold">{formatPrice(preview.summary.total)}</p>
            <p className="text-xs text-ink-muted">{preview.groups.length} seller order{preview.groups.length > 1 ? 's' : ''}</p>
          </div>
          <Button size="lg" onClick={submit} loading={place.isPending} disabled={preview.summary.hasIssues}><Lock /> {method === 'COD' ? 'Place order' : 'Pay now'}</Button>
        </div>
      </div>

      <PaymentDialog state={payState} amount={preview.summary.total} method={method} onClose={() => setPayState(null)} onRetry={() => { setSimulateFailure(false); place.mutate({ address: getValues(), fail: false }); }} />
    </div>
  );
}
