import { cn } from '@/lib/utils';

export const Card = ({ className, ...p }) => <div className={cn('card', className)} {...p} />;
export const CardHeader = ({ className, ...p }) => <div className={cn('flex items-start justify-between gap-4 p-5 pb-0', className)} {...p} />;
export const CardTitle = ({ className, ...p }) => <h3 className={cn('text-base font-semibold', className)} {...p} />;
export const CardDescription = ({ className, ...p }) => <p className={cn('text-sm text-ink-muted', className)} {...p} />;
export const CardContent = ({ className, ...p }) => <div className={cn('p-5', className)} {...p} />;
