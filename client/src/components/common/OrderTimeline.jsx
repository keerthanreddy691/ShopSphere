import { Check, X, RotateCcw } from 'lucide-react';
import { formatDateTime, titleCase } from '@/lib/format';
import { cn } from '@/lib/utils';

const FLOW = ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'];
const RETURN_FLOW = ['RETURN_REQUESTED', 'RETURNED', 'REFUNDED'];
const LABELS = { PLACED: 'Order placed', CONFIRMED: 'Confirmed by seller', PACKED: 'Packed', SHIPPED: 'Shipped', DELIVERED: 'Delivered', RETURN_REQUESTED: 'Return requested', RETURNED: 'Returned', REFUNDED: 'Refunded', CANCELLED: 'Cancelled' };

export function OrderTimeline({ status, history = [] }) {
  const at = (s) => [...history].reverse().find((h) => h.status === s);
  const cancelled = status === 'CANCELLED';
  const inReturn = RETURN_FLOW.includes(status);
  let steps = FLOW;
  if (cancelled) steps = [...FLOW.filter((s) => at(s)), 'CANCELLED'];
  if (inReturn) steps = [...FLOW, ...RETURN_FLOW];
  const currentIdx = steps.indexOf(status);

  return (
    <ol className="relative">
      {steps.map((s, i) => {
        const done = i <= currentIdx;
        const current = i === currentIdx;
        const entry = at(s);
        const isCancel = s === 'CANCELLED';
        const isReturn = RETURN_FLOW.includes(s);
        return (
          <li key={s} className="relative flex gap-4 pb-6 last:pb-0">
            {i < steps.length - 1 && (
              <span className={cn('absolute left-[15px] top-8 h-[calc(100%-24px)] w-0.5', i < currentIdx ? (isReturn ? 'bg-violet-400' : 'bg-emerald-500') : 'bg-slate-200')} />
            )}
            <span
              className={cn(
                'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition',
                isCancel ? 'border-red-500 bg-red-500 text-white' : done ? (isReturn ? 'border-violet-500 bg-violet-500 text-white' : 'border-emerald-500 bg-emerald-500 text-white') : 'border-slate-200 bg-white text-slate-300',
                current && !isCancel && 'ring-4 ring-emerald-100',
              )}
            >
              {isCancel ? <X className="size-4" /> : isReturn && done ? <RotateCcw className="size-3.5" /> : done ? <Check className="size-4" /> : <span className="size-2 rounded-full bg-current" />}
            </span>
            <div className="pt-1">
              <p className={cn('text-sm font-semibold', done ? 'text-ink' : 'text-ink-muted')}>{LABELS[s] || titleCase(s)}</p>
              {entry ? (
                <p className="text-xs text-ink-muted">
                  {formatDateTime(entry.at)}
                  {entry.note ? ` · ${entry.note}` : ''}
                </p>
              ) : (
                !done && <p className="text-xs text-slate-400">Pending</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
