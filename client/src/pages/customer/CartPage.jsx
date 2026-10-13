import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Store, AlertTriangle, ArrowRight, ShieldCheck, Truck, Heart } from 'lucide-react';
import { useCart, useUpdateCartItem, useRemoveCartItem, useToggleWishlist } from '@/hooks/useShopping';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { QuantitySelector } from '@/components/common/QuantitySelector';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { SafeImage } from '@/components/common/SafeImage';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';

export function OrderSummaryCard({ summary, children, couponDiscount = 0 }) {
  const rows = [
    [`Price (${summary.itemCount} item${summary.itemCount === 1 ? '' : 's'})`, formatPrice(summary.mrpTotal)],
    ['Product discount', summary.productDiscount > 0 ? `− ${formatPrice(summary.productDiscount)}` : formatPrice(0), 'text-emerald-600'],
    ...(couponDiscount > 0 ? [['Coupon discount', `− ${formatPrice(couponDiscount)}`, 'text-emerald-600']] : []),
    ['Delivery', summary.shipping ? formatPrice(summary.shipping) : 'Free', summary.shipping ? '' : 'text-emerald-600'],
  ];
  const total = summary.subtotal - couponDiscount + summary.shipping;
  const saved = summary.productDiscount + couponDiscount;
  return (
    <Card className="p-5">
      <p className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Price details</p>
      <dl className="mt-4 space-y-3 text-sm">
        {rows.map(([k, v, cls]) => (
          <div key={k} className="flex justify-between">
            <dt className="text-ink-soft">{k}</dt>
            <dd className={cn('font-medium', cls)}>{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex justify-between border-t border-dashed border-slate-200 pt-4 text-base font-bold">
        <span>Total amount</span>
        <span>{formatPrice(total)}</span>
      </div>
      {saved > 0 && <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">You save {formatPrice(saved)} on this order</p>}
      {children}
    </Card>
  );
}

function CartLine({ item }) {
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();
  const wishlist = useToggleWishlist();
  return (
    <li className="flex gap-4 py-5 first:pt-0 last:pb-0">
      <Link to={`/product/${item.product.slug}`} className="shrink-0">
        <SafeImage src={item.product.image} alt={item.product.name} className="size-20 rounded-xl object-cover sm:size-24" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link to={`/product/${item.product.slug}`} className="line-clamp-2 text-sm font-semibold hover:text-brand-700 sm:text-base">{item.product.name}</Link>
            {item.variantLabel && <p className="mt-0.5 text-xs text-ink-muted">{item.variantLabel}</p>}
          </div>
          <div className="shrink-0 text-right">
            <p className="font-bold">{formatPrice(item.lineTotal)}</p>
            {item.quantity > 1 && <p className="text-xs text-ink-muted">{formatPrice(item.price)} each</p>}
          </div>
        </div>
        <div className="mt-1 flex items-baseline gap-2 text-xs">
          {item.discount > 0 && <span className="text-ink-muted line-through">{formatPrice(item.mrp)}</span>}
          {item.discount > 0 && <span className="font-semibold text-emerald-600">{item.discount}% off</span>}
        </div>
        {item.issue && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
            <AlertTriangle className="size-3.5" /> {item.issue}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <QuantitySelector
            size="sm"
            value={item.quantity}
            max={Math.max(1, Math.min(10, item.stock))}
            disabled={update.isPending || item.stock <= 0}
            onChange={(q) => update.mutate({ itemId: item._id, quantity: q })}
          />
          <Button variant="ghost" size="sm" onClick={() => { wishlist.mutate({ productId: item.product._id, inWishlist: false }); remove.mutate(item._id); }}>
            <Heart /> Save for later
          </Button>
          <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700" loading={remove.isPending && remove.variables === item._id} onClick={() => remove.mutate(item._id)}>
            <Trash2 /> Remove
          </Button>
        </div>
      </div>
    </li>
  );
}

export default function CartPage() {
  const { data: cart, isLoading, isError, error, refetch } = useCart();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="container grid gap-6 py-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">{[1, 2].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}</div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }
  if (isError) return <div className="container py-10"><ErrorState error={error} onRetry={refetch} /></div>;
  if (!cart.items.length) {
    return (
      <div className="container py-10">
        <Card>
          <EmptyState icon={ShoppingCart} title="Your cart is empty" description="Looks like you haven't added anything yet. Explore thousands of products from trusted sellers." action={<Link to="/products"><Button>Start shopping</Button></Link>} />
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6 pb-28 sm:py-8 lg:pb-8">
      <h1 className="text-2xl font-bold sm:text-3xl">Shopping cart</h1>
      <p className="mt-1 text-sm text-ink-muted">
        {cart.summary.itemCount} items from {cart.summary.sellerCount} seller{cart.summary.sellerCount > 1 ? 's' : ''} · one checkout, {cart.summary.sellerCount > 1 ? 'shipped separately by each seller' : 'shipped by the seller'}
      </p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {cart.groups.map((g) => (
            <Card key={g.seller._id} className="overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-3">
                <Link to={g.store ? `/store/${g.store.slug}` : '#'} className="flex items-center gap-2.5 text-sm font-semibold hover:text-brand-700">
                  <SafeImage src={g.store?.logo} alt="" className="size-7 rounded-lg object-cover" />
                  <span className="flex items-center gap-1.5"><Store className="size-4 text-ink-muted" /> Sold by {g.store?.name || g.seller.name}</span>
                </Link>
                <span className="flex items-center gap-1 text-xs text-ink-muted">
                  <Truck className="size-3.5" /> {g.shippingFee ? `${formatPrice(g.shippingFee)} delivery` : 'Free delivery'}
                </span>
              </div>
              <ul className="divide-y divide-slate-100 p-5">
                {g.items.map((it) => <CartLine key={it._id} item={it} />)}
              </ul>
              <div className="flex justify-between border-t border-slate-100 px-5 py-3 text-sm">
                <span className="text-ink-muted">Seller subtotal</span>
                <span className="font-semibold">{formatPrice(g.subtotal)}</span>
              </div>
            </Card>
          ))}
        </div>
        <div className="lg:sticky lg:top-36 lg:self-start">
          <OrderSummaryCard summary={cart.summary}>
            {cart.summary.hasIssues && <p className="mt-3 text-xs font-medium text-amber-700">Remove or update unavailable items to continue.</p>}
            <Button size="lg" className="mt-5 hidden w-full lg:flex" disabled={cart.summary.hasIssues} onClick={() => navigate('/checkout')}>
              Proceed to checkout <ArrowRight />
            </Button>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-ink-muted"><ShieldCheck className="size-4" /> Safe and secure payments</p>
          </OrderSummaryCard>
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 backdrop-blur lg:hidden">
        <div className="container flex items-center gap-3 px-0">
          <div className="flex-1">
            <p className="text-lg font-bold">{formatPrice(cart.summary.total)}</p>
            <p className="text-xs text-ink-muted">{cart.summary.itemCount} items</p>
          </div>
          <Button size="lg" disabled={cart.summary.hasIssues} onClick={() => navigate('/checkout')}>Checkout <ArrowRight /></Button>
        </div>
      </div>
    </div>
  );
}
