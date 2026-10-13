import { cn, initials } from '@/lib/utils';

export function Avatar({ name, src, className }) {
  if (src) return <img src={src} alt={name} className={cn('size-9 rounded-full object-cover', className)} />;
  return (
    <div className={cn('flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white', className)}>
      {initials(name)}
    </div>
  );
}
