import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, Store, User, Headphones, Truck } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { Button } from '@/components/ui/button';
import { Input, Field } from '@/components/ui/input';
import { useLogin, ROLE_HOME } from '@/hooks/useAuth';

const schema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const DEMO = [
  ['Customer', 'customer@shopsphere.demo', User],
  ['Seller', 'seller@shopsphere.demo', Store],
  ['Admin', 'admin@shopsphere.demo', ShieldCheck],
  ['Support', 'support@shopsphere.demo', Headphones],
  ['Delivery', 'delivery@shopsphere.demo', Truck],
];

export default function LoginPage() {
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = (values) =>
    login.mutate(values, {
      onSuccess: (res) => {
        const role = res.data.user.role;
        const from = location.state?.from;
        navigate(from && (role === 'CUSTOMER' || from.startsWith(ROLE_HOME[role])) ? from : ROLE_HOME[role], { replace: true });
      },
    });

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to continue shopping or manage your store.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Email" error={errors.email?.message}>
          <Input icon={Mail} type="email" autoComplete="email" placeholder="you@example.com" invalid={!!errors.email} {...register('email')} />
        </Field>
        <Field label="Password" error={errors.password?.message}>
          <Input icon={Lock} type="password" autoComplete="current-password" placeholder="••••••••" invalid={!!errors.password} {...register('password')} />
        </Field>
        {login.error && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700 ring-1 ring-red-200">{login.error.message}</p>}
        <Button type="submit" size="lg" className="w-full" loading={login.isPending}>Log in</Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-muted">
        New to ShopSphere? <Link to="/register" className="font-semibold text-brand-600 hover:underline">Create an account</Link>
      </p>

      <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Demo accounts · password Demo@123</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {DEMO.map(([label, email, Icon]) => (
            <button
              key={email}
              type="button"
              onClick={() => {
                setValue('email', email, { shouldValidate: true });
                setValue('password', 'Demo@123', { shouldValidate: true });
              }}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-left text-xs font-semibold text-ink-soft transition hover:border-brand-300 hover:text-brand-700"
            >
              <Icon className="size-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>
    </AuthLayout>
  );
}
