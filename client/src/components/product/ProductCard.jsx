import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Store } from 'lucide-react';
import { SafeImage } from '@/components/common/SafeImage';
import { RatingPill } from '@/components/common/Rating';
import { Skeleton } from '@/components/ui/skeleton';
import { WishlistButton } from './WishlistButton';
import { formatPrice } from '@/lib/format';
import { cn, productImage } from '@/lib/utils';

export function ProductCard({ product: p, className, reason }) {
  const outOfStock = p.stock <= 0;
  const lowStock = !outOfStock && p.stock <= 5;
  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.15 }} className={cn('group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card transition-shadow hover:shadow-lift', className)}>
      <Link to={`/product/${p.slug}`} className="relative block aspect-square overflow-hidden bg-slate-100">
        <SafeImage src={productImage(p)} alt={p.name} className={cn('size-full object-cover transition duration-500 group-hover:scale-105', outOfStock && 'opacity-60 grayscale')} />
        <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
          {p.discount >= 5 && <span className="rounded-md bg-accent-500 px-1.5 py-0.5 text-[11px] font-bold text-white shadow-sm">-{p.discount}%</span>}
          {outOfStock && <span className="rounded-md bg-slate-900/85 px-1.5 py-0.5 text-[11px] font-semibold text-white">Out of stock</span>}
        </div>
      </Link>
      <WishlistButton productId={p._id} className="absolute right-2.5 top-2.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 [&[aria-pressed=true]]:opacity-100" />
      <div className="flex flex-1 flex-col p-3 sm:p-3.5">
        {p.brand && <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{p.brand}</p>}
        <Link to={`/product/${p.slug}`} className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug text-ink hover:text-brand-700">
          {p.name}
        </Link>
        <RatingPill rating={p.rating} count={p.reviewCount} className="mt-1.5" />
        <div className="mt-auto pt-2.5">
          <div className="flex flex-wrap items-baseline gap-x-1.5">
            <span className="text-base font-bold">{formatPrice(p.finalPrice)}</span>
            {p.discount > 0 && <span className="text-xs text-ink-muted line-through">{formatPrice(p.price)}</span>}
          </div>
          {p.store?.name && (
            <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-ink-muted">
              <Store className="size-3 shrink-0" /> {p.store.name}
            </p>
          )}
          {lowStock && <p className="mt-1 text-[11px] font-semibold text-orange-600">Only {p.stock} left</p>}
          {reason && <p className="mt-1.5 line-clamp-1 rounded-md bg-violet-50 px-1.5 py-0.5 text-[11px] font-medium text-violet-700">{reason}</p>}
        </div>
      </div>
    </motion.div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
      <Skeleton className="aspect-square rounded-none" />
      <div className="space-y-2 p-3.5">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-3 h-5 w-24" />
      </div>
    </div>
  );
}
