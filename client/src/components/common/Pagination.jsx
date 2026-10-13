import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function pages(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, current, current - 1, current + 1].filter((p) => p >= 1 && p <= total));
  const sorted = [...set].sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i && p - sorted[i - 1] > 1) out.push('…' + p);
    out.push(p);
  });
  return out;
}

export function Pagination({ page, pages: total, onChange, className }) {
  if (!total || total <= 1) return null;
  return (
    <nav className={cn('flex items-center justify-center gap-1', className)} aria-label="Pagination">
      <Button variant="outline" size="icon-sm" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
        <ChevronLeft />
      </Button>
      {pages(page, total).map((p) =>
        typeof p === 'string' ? (
          <span key={p} className="px-1.5 text-sm text-ink-muted">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={cn('h-8 min-w-8 rounded-lg px-2 text-sm font-medium transition', p === page ? 'bg-slate-900 text-white' : 'text-ink-soft hover:bg-slate-100')}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        ),
      )}
      <Button variant="outline" size="icon-sm" disabled={page >= total} onClick={() => onChange(page + 1)} aria-label="Next page">
        <ChevronRight />
      </Button>
    </nav>
  );
}
