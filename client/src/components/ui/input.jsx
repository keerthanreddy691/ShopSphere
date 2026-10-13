import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const base = 'w-full rounded-xl border bg-white px-3.5 text-sm text-ink placeholder:text-slate-400 transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70';
const state = (invalid) => (invalid ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-brand-400 focus:ring-brand-100');

export const Input = forwardRef(function Input({ className, invalid, icon: Icon, ...props }, ref) {
  if (Icon) {
    return (
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input ref={ref} className={cn(base, state(invalid), 'h-10 pl-9', className)} aria-invalid={invalid || undefined} {...props} />
      </div>
    );
  }
  return <input ref={ref} className={cn(base, state(invalid), 'h-10', className)} aria-invalid={invalid || undefined} {...props} />;
});

export const Textarea = forwardRef(function Textarea({ className, invalid, rows = 4, ...props }, ref) {
  return <textarea ref={ref} rows={rows} className={cn(base, state(invalid), 'py-2.5 leading-relaxed', className)} aria-invalid={invalid || undefined} {...props} />;
});

export const Select = forwardRef(function Select({ className, invalid, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(base, state(invalid), 'h-10 appearance-none bg-[url("data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 20 20%27 fill=%27%2364748b%27><path d=%27M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z%27/></svg>")] bg-[length:1.1rem] bg-[right_0.6rem_center] bg-no-repeat pr-9', className)}
      {...props}
    >
      {children}
    </select>
  );
});

export function Field({ label, error, hint, children, className, required }) {
  return (
    <div className={className}>
      {label && (
        <label className="label">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      {children}
      {error ? <p className="field-error">{error}</p> : hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
}

export function Checkbox({ className, label, ...props }) {
  return (
    <label className={cn('flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft', className)}>
      <input type="checkbox" className="size-4 rounded border-slate-300 text-brand-600 accent-brand-600" {...props} />
      {label}
    </label>
  );
}

export function Switch({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn('relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-50', checked ? 'bg-brand-600' : 'bg-slate-300')}
    >
      <span className={cn('inline-block size-5 rounded-full bg-white shadow transition', checked ? 'translate-x-5' : 'translate-x-0.5')} />
    </button>
  );
}
