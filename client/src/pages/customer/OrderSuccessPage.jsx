import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Store, Package, ArrowRight, MapPin } from 'lucide-react';
import { useCheckoutSummary } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SafeImage } from '@/components/common/SafeImage';
import { formatPrice, titleCase } from '@/lib/format';

export default function OrderSuccessPage() {
  const { checkoutId } = useParams();
  const { data, isLoading, isError, error } = useCheckoutSummary(checkoutId);
  if (isLoading) return <div className="container max-w-3xl space-y-4 py-10"><Skeleton className="h-40 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /></div>;
  if (isError) return <div className="container py-10"><ErrorState error={error} /></div>;
  const a = data.shippingAddress;
  return (
    <div className="container max-w-3xl py-8 sm:py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <CheckCircle2 className="mx-auto size-16 text-emerald-500" />
        <h1 className="mt-4 text-3xl font-bold">Thank you! Your order is confirmed.</h1>
        <p className="mt-2 text-ink-muted">
          Checkout <span className="font-mono font-semibold text-ink">{data.checkoutId}</span> · {formatPrice(data.summary.total)} paid via {titleCase(data.paymentMethod)}
        </p>
        {data.orders.length > 1 && (
          <p className="mx-auto mt-4 max-w-lg rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
            Your cart had items from {data.orders.length} sellers, so we created {data.orders.length} separate orders. Each seller ships their items independently — track them all below.
          </p>
        )}
      </motion.div>

      <div className="mt-8 space-y-4">
        {data.orders.map((o) => (
          <Card key={o._id} className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70 px-5 py-3">
              <span className="flex items-center gap-2 text-sm font-semibold"><Store className="size-4 text-ink-muted" /> {o.store?.name}</span>
              <span className="flex items-center gap-2 text-sm">
                <span className="font-mono text-xs text-ink-muted">{o.orderNumber}</span>
                <StatusBadge status={o.status} />
              </span>
            </div>
            <ul className="divide-y divide-slate-100 px-5">
              {o.items.map((it) => (
                <li key={it._id} className="flex items-center gap-3 py-3">
                  <SafeImage src={it.image} alt="" className="size-12 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{it.name}</p>
                    <p className="text-xs text-ink-muted">{it.variantLabel ? `${it.variantLabel} · ` : ''}Qty {it.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold">{formatPrice(it.lineTotal)}</p>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
              <span className="text-sm text-ink-muted">Order total <span className="font-semibold text-ink">{formatPrice(o.total)}</span></span>
              <Link to={`/account/orders/${o._id}`}><Button variant="soft" size="sm">Track order <ArrowRight /></Button></Link>
            </div>
          </Card>
        ))}
        <Card className="flex gap-3 p-5 text-sm">
          <MapPin className="size-5 shrink-0 text-brand-600" />
          <div>
            <p className="font-semibold">Delivering to {a.fullName}</p>
            <p className="text-ink-muted">{[a.line1, a.line2, a.city, a.state, a.pincode].filter(Boolean).join(', ')} · {a.phone}</p>
          </div>
        </Card>
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/account/orders"><Button variant="outline"><Package /> View all orders</Button></Link>
        <Link to="/products"><Button>Continue shopping</Button></Link>
      </div>
    </div>
  );
}
