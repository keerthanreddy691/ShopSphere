import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700',
        secondary: 'bg-slate-900 text-white shadow-sm hover:bg-slate-800',
        accent: 'bg-accent-500 text-white shadow-sm hover:bg-accent-600',
        outline: 'border border-slate-200 bg-white text-ink hover:bg-slate-50 hover:border-slate-300',
        ghost: 'text-ink-soft hover:bg-slate-100 hover:text-ink',
        soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
        destructive: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
        success: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700',
        link: 'text-brand-600 underline-offset-4 hover:underline px-0 h-auto',
      },
      size: {
        sm: 'h-8 px-3 text-xs [&_svg]:size-3.5',
        md: 'h-10 px-4 [&_svg]:size-4',
        lg: 'h-12 px-6 text-base [&_svg]:size-5',
        icon: 'h-10 w-10 [&_svg]:size-[18px]',
        'icon-sm': 'h-8 w-8 [&_svg]:size-4',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export const Button = forwardRef(function Button({ className, variant, size, loading, disabled, children, type = 'button', ...props }, ref) {
  return (
    <button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="animate-spin" />}
      {children}
    </button>
  );
});
