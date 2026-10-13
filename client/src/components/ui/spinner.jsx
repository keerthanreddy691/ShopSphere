import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Spinner = ({ className }) => <Loader2 className={cn('size-5 animate-spin text-brand-600', className)} />;

export const PageLoader = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <Spinner className="size-8" />
  </div>
);
