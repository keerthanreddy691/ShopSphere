import { ProductCard, ProductCardSkeleton } from './ProductCard';
import { cn } from '@/lib/utils';

export function ProductGrid({ products, loading, skeletons = 8, className, reasons }) {
  const cls = cn('grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4', className);
  if (loading) {
    return (
      <div className={cls}>
        {Array.from({ length: skeletons }).map((_, i) => <ProductCardSkeleton key={i} />)}
      </div>
    );
  }
  return (
    <div className={cls}>
      {products.map((p) => <ProductCard key={p._id} product={p} reason={reasons?.[p._id]} />)}
    </div>
  );
}
