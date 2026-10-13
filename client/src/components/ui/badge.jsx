import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const badgeVariants = cva('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset', {
  variants: {
    variant: {
      default: 'bg-slate-100 text-slate-700 ring-slate-200',
      brand: 'bg-brand-50 text-brand-700 ring-brand-200',
      success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
      warning: 'bg-amber-50 text-amber-700 ring-amber-200',
      danger: 'bg-red-50 text-red-700 ring-red-200',
      info: 'bg-sky-50 text-sky-700 ring-sky-200',
      purple: 'bg-violet-50 text-violet-700 ring-violet-200',
      orange: 'bg-orange-50 text-orange-700 ring-orange-200',
      solid: 'bg-slate-900 text-white ring-slate-900',
    },
  },
  defaultVariants: { variant: 'default' },
});

export const Badge = ({ className, variant, ...p }) => <span className={cn(badgeVariants({ variant }), className)} {...p} />;
