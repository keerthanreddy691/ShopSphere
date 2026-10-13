import { Logo } from '@/components/layout/Logo';
import { SafeImage } from '@/components/common/SafeImage';

export function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-5 py-8 sm:px-10">
        <Logo />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <h1 className="text-3xl font-bold">{title}</h1>
          {subtitle && <p className="mt-2 text-ink-muted">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-slate-900 lg:block">
        <SafeImage src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1400&q=80&auto=format&fit=crop" alt="" className="absolute inset-0 size-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />
        <div className="absolute bottom-0 p-12 text-white">
          <p className="text-3xl font-bold leading-tight text-white">"One cart for every store I love. Checkout takes seconds."</p>
          <p className="mt-4 text-slate-300">Priya S., Bengaluru · ShopSphere customer</p>
        </div>
      </div>
    </div>
  );
}
