import { cn } from '@/lib/utils';

export function Tabs({ tabs, value, onChange, className }) {
  return (
    <div className={cn('scrollbar-none -mx-1 flex gap-1 overflow-x-auto px-1', className)} role="tablist">
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition',
              active ? 'bg-slate-900 text-white shadow-sm' : 'text-ink-muted hover:bg-slate-100 hover:text-ink',
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={cn('rounded-full px-1.5 text-[11px] font-semibold', active ? 'bg-white/20' : 'bg-slate-200 text-slate-600')}>{t.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
