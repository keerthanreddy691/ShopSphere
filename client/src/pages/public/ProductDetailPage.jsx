import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ShoppingCart, Zap, Truck, RotateCcw, ShieldCheck, Store, Star, Check, Sparkles, PackageX } from 'lucide-react';
import { toast } from 'sonner';
import { useProduct } from '@/hooks/useCatalog';
import { useAddToCart } from '@/hooks/useShopping';
import { useAuth } from '@/hooks/useAuth';
import { get } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs } from '@/components/ui/tabs';
import { Price } from '@/components/common/Price';
import { RatingPill } from '@/components/common/Rating';
import { QuantitySelector } from '@/components/common/QuantitySelector';
import { SafeImage } from '@/components/common/SafeImage';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { WishlistButton } from '@/components/product/WishlistButton';
import { ProductRail } from '@/components/product/ProductRail';
import { ProductReviews } from '@/components/product/ProductReviews';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/format';

const priceAfter = (mrp, d) => Math.round(mrp * (1 - (d || 0) / 100) * 100) / 100;

function Gallery({ images, name }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    setActive(0);
  }, [images]);
  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row lg:sticky lg:top-36">
      {images.length > 1 && (
        <div className="scrollbar-none flex gap-2 overflow-x-auto sm:flex-col">
          {images.map((src, i) => (
            <button key={src} onClick={() => setActive(i)} className={cn('size-16 shrink-0 overflow-hidden rounded-xl border-2 transition sm:size-20', i === active ? 'border-brand-500' : 'border-transparent opacity-70 hover:opacity-100')} aria-label={`Image ${i + 1}`}>
              <SafeImage src={src} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="relative aspect-square flex-1 overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
        <AnimatePresence mode="wait">
          <motion.div key={active} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="size-full">
            <SafeImage src={images[active]} alt={name} className="size-full object-cover" />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function VariantPicker({ variants, selected, onSelect }) {
  const keys = useMemo(() => [...new Set(variants.flatMap((v) => Object.keys(v.options || {})))], [variants]);
  return (
    <div className="space-y-4">
      {keys.map((key) => {
        const values = [...new Set(variants.map((v) => v.options?.[key]).filter(Boolean))];
        return (
          <div key={key}>
            <p className="mb-2 text-sm font-semibold">
              {key}: <span className="font-normal text-ink-muted">{selected[key]}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {values.map((val) => {
                const anyInStock = variants.some((v) => v.options?.[key] === val && v.stock > 0);
                const active = selected[key] === val;
                return (
                  <button
                    key={val}
                    onClick={() => onSelect({ ...selected, [key]: val })}
                    disabled={!anyInStock}
                    className={cn(
                      'relative min-w-12 rounded-xl border px-3.5 py-2 text-sm font-medium transition',
                      active ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-100' : 'border-slate-200 bg-white hover:border-slate-300',
                      !anyInStock && 'cursor-not-allowed text-slate-300 line-through',
                    )}
                  >
                    {val}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SimilarProducts({ product }) {
  const { data, isLoading } = useQuery({
    queryKey: ['similar', product._id],
    queryFn: async () => {
      try {
        const d = await get(`/ai/similar/${product._id}`, { limit: 10 });
        return { items: d.items.map((i) => i.product), reasons: Object.fromEntries(d.items.map((i) => [i.product._id, i.reason])) };
      } catch {
        const d = await get('/products', { category: product.category?.slug, exclude: product._id, limit: 10, sort: 'popular' });
        return { items: d.items, reasons: {} };
      }
    },
  });
  return (
    <ProductRail
      title="Similar products"
      subtitle="Matched on category, tags, price range and specifications"
      icon={Sparkles}
      badge={<Badge variant="purple" className="ml-1"><Sparkles className="size-3" /> AI</Badge>}
      products={data?.items}
      reasons={data?.reasons}
      loading={isLoading}
    />
  );
}

function DetailSkeleton() {
  return (
    <div className="container grid gap-8 py-8 lg:grid-cols-2">
      <Skeleton className="aspect-square rounded-2xl" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { data: p, isLoading, isError, error, refetch } = useProduct(slug);
  const { user } = useAuth();
  const addToCart = useAddToCart();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState({});
  const [tab, setTab] = useState('description');

  useEffect(() => {
    if (!p) return;
    const first = p.variants?.find((v) => v.stock > 0) || p.variants?.[0];
    setSelected(first ? { ...first.options } : {});
    setQty(1);
  }, [p]);

  const variant = useMemo(() => {
    if (!p?.variants?.length) return null;
    return p.variants.find((v) => Object.entries(selected).every(([k, x]) => v.options?.[k] === x)) || null;
  }, [p, selected]);

  if (isLoading) return <DetailSkeleton />;
  if (isError) return <div className="container py-10"><ErrorState error={error} onRetry={refetch} /></div>;

  const hasVariants = p.variants?.length > 0;
  const mrp = variant?.price ?? p.price;
  const price = priceAfter(mrp, p.discount);
  const stock = hasVariants ? variant?.stock ?? 0 : p.stock;
  const unavailable = p.moderationStatus !== 'APPROVED' || p.status !== 'ACTIVE';
  const canBuy = stock > 0 && (!hasVariants || variant) && !unavailable;

  const add = (buyNow) => {
    if (!user) {
      toast.info('Please log in to add items to your cart');
      return navigate('/login', { state: { from: `/product/${p.slug}` } });
    }
    if (user.role !== 'CUSTOMER') return toast.info('Switch to a customer account to shop');
    addToCart.mutate(
      { productId: p._id, variantId: variant?._id || null, quantity: qty },
      { onSuccess: () => buyNow && navigate('/checkout') },
    );
  };

  return (
    <div className="pb-8">
      <div className="container py-4">
        <nav className="flex flex-wrap items-center gap-1 text-xs text-ink-muted">
          <Link to="/" className="hover:text-ink">Home</Link>
          <ChevronRight className="size-3" />
          <Link to={`/category/${p.category?.slug}`} className="hover:text-ink">{p.category?.name}</Link>
          <ChevronRight className="size-3" />
          <span className="line-clamp-1 text-ink">{p.name}</span>
        </nav>
      </div>

      <div className="container grid gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
        <Gallery images={p.images?.length ? p.images : ['']} name={p.name} />

        <div>
          {unavailable && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200">
              Preview only — this product is <StatusBadge status={p.moderationStatus} /> and not visible to shoppers.
            </div>
          )}
          <Link to={`/products?brand=${encodeURIComponent(p.brand)}`} className="text-sm font-semibold uppercase tracking-wide text-brand-600 hover:underline">{p.brand}</Link>
          <h1 className="mt-1.5 text-2xl font-bold leading-tight sm:text-3xl">{p.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <RatingPill rating={p.rating} count={p.reviewCount} />
            {p.soldCount > 0 && <span className="text-xs text-ink-muted">{p.soldCount}+ bought</span>}
            {p.isFeatured && <Badge variant="brand">Featured</Badge>}
          </div>

          <div className="mt-5 rounded-2xl bg-slate-50 p-4">
            <Price price={price} mrp={mrp} discount={p.discount} size="lg" />
            <p className="mt-1 text-xs text-ink-muted">Inclusive of all taxes · {price >= 499 ? 'Free delivery' : '₹49 delivery fee'}</p>
          </div>

          {p.shortDescription && <p className="mt-5 leading-relaxed text-ink-soft">{p.shortDescription}</p>}

          {hasVariants && (
            <div className="mt-6">
              <VariantPicker variants={p.variants} selected={selected} onSelect={setSelected} />
            </div>
          )}

          <div className="mt-6 flex items-center gap-4">
            <QuantitySelector value={qty} onChange={setQty} max={Math.max(1, Math.min(10, stock))} disabled={!canBuy} />
            <p className={cn('text-sm font-medium', stock > 5 ? 'text-emerald-600' : stock > 0 ? 'text-orange-600' : 'text-red-600')}>
              {stock > 5 ? <span className="flex items-center gap-1"><Check className="size-4" /> In stock</span> : stock > 0 ? `Hurry, only ${stock} left` : hasVariants && !variant ? 'Select an option' : 'Out of stock'}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-[1fr_1fr_auto] gap-3">
            <Button size="lg" variant="outline" className="border-brand-200 text-brand-700 hover:bg-brand-50" disabled={!canBuy} loading={addToCart.isPending} onClick={() => add(false)}>
              <ShoppingCart /> <span className="hidden sm:inline">Add to cart</span><span className="sm:hidden">Add</span>
            </Button>
            <Button size="lg" variant="accent" disabled={!canBuy || addToCart.isPending} onClick={() => add(true)}>
              <Zap /> Buy now
            </Button>
            <WishlistButton productId={p._id} withLabel className="px-3 sm:px-5 [&>span]:hidden" />
          </div>
          {!canBuy && stock === 0 && !unavailable && (
            <p className="mt-3 flex items-center gap-2 text-sm text-ink-muted"><PackageX className="size-4" /> Currently unavailable. Add it to your wishlist and check back soon.</p>
          )}

          <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs text-ink-soft">
            {[[Truck, 'Delivery in 3–5 days'], [RotateCcw, '7-day easy returns'], [ShieldCheck, 'Secure payment']].map(([Icon, t]) => (
              <div key={t} className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white p-3">
                <Icon className="size-5 text-brand-600" /> {t}
              </div>
            ))}
          </div>

          {p.store && (
            <Link to={`/store/${p.store.slug}`} className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 transition hover:border-brand-200 hover:shadow-card">
              <SafeImage src={p.store.logo} alt={p.store.name} className="size-12 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-ink-muted">Sold by</p>
                <p className="flex items-center gap-1.5 font-semibold"><Store className="size-4 text-brand-600" /> {p.store.name}</p>
                <p className="text-xs text-ink-muted">{p.store.city}{p.store.rating ? ` · ${p.store.rating.toFixed(1)}★ seller rating` : ''}</p>
              </div>
              <ChevronRight className="size-5 text-slate-300" />
            </Link>
          )}
        </div>
      </div>

      <div className="container mt-12">
        <div className="card p-5 sm:p-6">
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'description', label: 'Description' },
              { value: 'specs', label: 'Specifications' },
              { value: 'reviews', label: 'Reviews', count: p.reviewCount },
            ]}
          />
          <div className="mt-6">
            {tab === 'description' && (
              <div className="max-w-3xl space-y-4 leading-relaxed text-ink-soft">
                {(p.description || p.shortDescription || 'No description provided.').split('\n').filter(Boolean).map((para, i) => <p key={i}>{para}</p>)}
                {p.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {p.tags.map((t) => <Link key={t} to={`/products?q=${encodeURIComponent(t)}`}><Badge>#{t}</Badge></Link>)}
                  </div>
                )}
              </div>
            )}
            {tab === 'specs' && (
              p.attributes?.length ? (
                <dl className="grid max-w-3xl overflow-hidden rounded-xl border border-slate-200 sm:grid-cols-[200px_1fr]">
                  {[['Brand', p.brand], ['Category', p.category?.name], ...p.attributes.map((a) => [a.key, a.value]), ['SKU', variant?.sku || p.sku]].filter(([, v]) => v).map(([k, v], i) => (
                    <div key={k + i} className="contents">
                      <dt className="border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-medium text-ink-muted">{k}</dt>
                      <dd className="border-b border-slate-100 px-4 py-2.5 text-sm">{v}</dd>
                    </div>
                  ))}
                </dl>
              ) : <p className="text-sm text-ink-muted">No specifications listed.</p>
            )}
            {tab === 'reviews' && <ProductReviews productId={p._id} />}
          </div>
        </div>
      </div>

      <div className="container mt-12">
        <SimilarProducts product={p} />
      </div>

      {canBuy && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 backdrop-blur sm:hidden">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold">{formatPrice(price)}</p>
              {p.discount > 0 && <p className="text-xs text-emerald-600">{p.discount}% off <Star className="inline size-3 fill-amber-400 text-amber-400" /> {p.rating?.toFixed(1)}</p>}
            </div>
            <Button variant="accent" loading={addToCart.isPending} onClick={() => add(false)}><ShoppingCart /> Add to cart</Button>
          </div>
        </div>
      )}
    </div>
  );
}
