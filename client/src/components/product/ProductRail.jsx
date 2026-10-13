import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ProductCard, ProductCardSkeleton } from './ProductCard';

export function SectionHeader({ title, subtitle, to, icon: Icon, badge }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          {Icon && <Icon className="size-5 text-brand-600" />}
          <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
          {badge}
        </div>
        {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {to && (
        <Link to={to} className="group inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
          View all <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

// Mobile scrolls through every item; wider screens show exactly one row (3 / 4 / 5 columns).
const RAIL_VISIBILITY = ['sm:w-auto', 'sm:w-auto', 'sm:w-auto', 'sm:hidden lg:block lg:w-auto', 'sm:hidden xl:block xl:w-auto', 'sm:hidden'];

export function ProductRail({ title, subtitle, to, icon, badge, products, loading, reasons }) {
  if (!loading && !products?.length) return null;
  return (
    <section>
      <SectionHeader title={title} subtitle={subtitle} to={to} icon={icon} badge={badge} />
      <div className="scrollbar-none -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-4 xl:grid-cols-5">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-[46%] shrink-0 snap-start sm:w-auto"><ProductCardSkeleton /></div>
            ))
          : products.map((p, i) => (
              <div key={p._id} className={`w-[46%] shrink-0 snap-start ${RAIL_VISIBILITY[Math.min(i, 5)]}`}>
                <ProductCard product={p} reason={reasons?.[p._id]} className="h-full" />
              </div>
            ))}
      </div>
    </section>
  );
}
