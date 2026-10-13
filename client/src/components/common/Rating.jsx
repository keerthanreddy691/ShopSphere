import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Stars({ value = 0, size = 'sm', className }) {
  const s = size === 'lg' ? 'size-5' : size === 'md' ? 'size-4' : 'size-3.5';
  return (
    <div className={cn('flex items-center gap-0.5', className)} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i + 1));
        return (
          <span key={i} className="relative inline-block">
            <Star className={cn(s, 'text-slate-200')} fill="currentColor" strokeWidth={0} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className={cn(s, 'text-amber-400')} fill="currentColor" strokeWidth={0} />
            </span>
          </span>
        );
      })}
    </div>
  );
}

export function RatingPill({ rating, count, className }) {
  if (!rating) return <span className={cn('text-xs text-ink-muted', className)}>No ratings yet</span>;
  return (
    <div className={cn('flex items-center gap-1.5 text-xs', className)}>
      <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-600 px-1.5 py-0.5 font-semibold text-white">
        {Number(rating).toFixed(1)} <Star className="size-3" fill="currentColor" strokeWidth={0} />
      </span>
      {count !== undefined && <span className="text-ink-muted">({count})</span>}
    </div>
  );
}

export function StarInput({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" onClick={() => onChange(i)} aria-label={`${i} star`} className="transition hover:scale-110">
          <Star className={cn('size-7', i <= value ? 'text-amber-400' : 'text-slate-200')} fill="currentColor" strokeWidth={0} />
        </button>
      ))}
    </div>
  );
}
