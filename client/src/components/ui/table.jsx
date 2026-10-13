import { cn } from '@/lib/utils';

export const TableWrap = ({ className, ...p }) => <div className={cn('overflow-x-auto', className)} {...p} />;
export const Table = ({ className, ...p }) => <table className={cn('w-full min-w-[640px] text-left text-sm', className)} {...p} />;
export const THead = ({ className, ...p }) => <thead className={cn('border-b border-slate-100 bg-slate-50/70 text-xs uppercase tracking-wide text-ink-muted', className)} {...p} />;
export const TH = ({ className, ...p }) => <th className={cn('whitespace-nowrap px-4 py-3 font-semibold', className)} {...p} />;
export const TBody = ({ className, ...p }) => <tbody className={cn('divide-y divide-slate-100', className)} {...p} />;
export const TR = ({ className, ...p }) => <tr className={cn('transition hover:bg-slate-50/60', className)} {...p} />;
export const TD = ({ className, ...p }) => <td className={cn('px-4 py-3 align-middle', className)} {...p} />;
