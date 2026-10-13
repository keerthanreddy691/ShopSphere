import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';

export function Price({ price, mrp, discount, size = 'md', className }) {
  const sizes = { sm: 'text-base', md: 'text-lg', lg: 'text-3xl' };
  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-0.5', className)}>
      <span className={cn('font-bold tracking-tight text-ink', sizes[size])}>{formatPrice(price)}</span>
      {mrp > price && <span className="text-sm text-ink-muted line-through">{formatPrice(mrp)}</span>}
      {discount > 0 && <span className="text-sm font-semibold text-emerald-600">{discount}% off</span>}
    </div>
  );
}
