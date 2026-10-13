import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function LogoMark({ className }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-8', className)} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#4f46e5" />
      <circle cx="16" cy="16" r="8.5" fill="none" stroke="#fff" strokeWidth="2.4" />
      <path d="M7.5 16h17M16 7.5c2.6 2.6 3.6 5.4 3.6 8.5s-1 5.9-3.6 8.5c-2.6-2.6-3.6-5.4-3.6-8.5s1-5.9 3.6-8.5z" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="24.5" cy="8" r="3" fill="#f97316" />
    </svg>
  );
}

export function Logo({ to = '/', className, light, subtitle }) {
  return (
    <Link to={to} className={cn('flex shrink-0 items-center gap-2', className)} aria-label="ShopSphere home">
      <LogoMark />
      <span className="leading-none">
        <span className={cn('block font-display text-xl font-extrabold tracking-tight', light ? 'text-white' : 'text-ink')}>
          Shop<span className="text-brand-600">Sphere</span>
        </span>
        {subtitle && <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">{subtitle}</span>}
      </span>
    </Link>
  );
}
