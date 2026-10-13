import { PackageOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EmptyState({ icon: Icon = PackageOpen, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <div className="relative mb-5">
        <div className="absolute inset-0 scale-150 rounded-full bg-brand-100/60 blur-xl" />
        <div className="relative flex size-16 items-center justify-center rounded-2xl bg-white shadow-card ring-1 ring-slate-200">
          <Icon className="size-7 text-brand-600" strokeWidth={1.75} />
        </div>
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
