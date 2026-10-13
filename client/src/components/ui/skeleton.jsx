import { cn } from '@/lib/utils';

export const Skeleton = ({ className }) => (
  <div className={cn('relative overflow-hidden rounded-lg bg-slate-200/70', className)}>
    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
  </div>
);
