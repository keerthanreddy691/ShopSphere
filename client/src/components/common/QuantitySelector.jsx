import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function QuantitySelector({ value, onChange, min = 1, max = 10, disabled, size = 'md' }) {
  const h = size === 'sm' ? 'h-8' : 'h-10';
  return (
    <div className={cn('inline-flex items-center rounded-xl border border-slate-200 bg-white', h)}>
      <button type="button" className="flex h-full w-9 items-center justify-center text-ink-soft hover:text-ink disabled:opacity-40" disabled={disabled || value <= min} onClick={() => onChange(value - 1)} aria-label="Decrease quantity">
        <Minus className="size-4" />
      </button>
      <span className="w-8 text-center text-sm font-semibold tabular-nums">{value}</span>
      <button type="button" className="flex h-full w-9 items-center justify-center text-ink-soft hover:text-ink disabled:opacity-40" disabled={disabled || value >= max} onClick={() => onChange(value + 1)} aria-label="Increase quantity">
        <Plus className="size-4" />
      </button>
    </div>
  );
}
