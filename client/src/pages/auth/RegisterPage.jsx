import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { User, Mail, Lock, Phone, Building2, ShoppingBag, Store, FileText } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { Button } from '@/components/ui/button';
import { Input, Field } from '@/components/ui/input';
import { useRegister, ROLE_HOME } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const schema = z
  .object({
    role: z.enum(['CUSTOMER', 'SELLER']),
    name: z.string().trim().min(2, 'Enter your full name'),
    email: z.email('Enter a valid email address'),
    phone: z.string().trim().regex(/^$|^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number').optional(),
    password: z.string().min(6, 'Use at least 6 characters'),
    confirm: z.string(),
    businessName: z.string().trim().optional(),
    gstin: z.string().trim().optional(),
  })
  .refine((d) => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] })
  .refine((d) => d.role !== 'SELLER' || (d.businessName && d.businessName.length >= 2), { message: 'Business name is required', path: ['businessName'] });

export default function RegisterPage() {
  const [params] = useSearchParams();
  const registerUser = useRegister();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, setValue, setError, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role: params.get('role') === 'seller' ? 'SELLER' : 'CUSTOMER', phone: '' },
  });
  const role = watch('role');

  const onSubmit = ({ confirm, ...values }) =>
    registerUser.mutate(values, {
      onSuccess: (res) => navigate(ROLE_HOME[res.data.user.role], { replace: true }),
      onError: (e) => e.errors?.forEach((err) => err.field && setError(err.field, { message: err.message })),
    });

  return (
    <AuthLayout title="Create your account" subtitle="Shop from hundreds of sellers — or start selling to customers across India.">
      <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
        {[['CUSTOMER', 'I want to shop', ShoppingBag], ['SELLER', 'I want to sell', Store]].map(([r, label, Icon]) => (
          <button key={r} type="button" onClick={() => setValue('role', r)} className={cn('flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition', role === r ? 'bg-white text-ink shadow-sm' : 'text-ink-muted')}>
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Full name" error={errors.name?.message} required>
          <Input icon={User} placeholder="Priya Sharma" invalid={!!errors.name} {...register('name')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" error={errors.email?.message} required>
            <Input icon={Mail} type="email" placeholder="you@example.com" invalid={!!errors.email} {...register('email')} />
          </Field>
          <Field label="Mobile" error={errors.phone?.message}>
            <Input icon={Phone} placeholder="98765 43210" invalid={!!errors.phone} {...register('phone')} />
          </Field>
        </div>
        {role === 'SELLER' && (
          <div className="grid gap-4 rounded-xl border border-brand-100 bg-brand-50/40 p-4 sm:grid-cols-2">
            <Field label="Business name" error={errors.businessName?.message} required>
              <Input icon={Building2} placeholder="Sharma Textiles" invalid={!!errors.businessName} {...register('businessName')} />
            </Field>
            <Field label="GSTIN" hint="Optional for the demo">
              <Input icon={FileText} placeholder="29ABCDE1234F1Z5" {...register('gstin')} />
            </Field>
            <p className="text-xs text-ink-muted sm:col-span-2">Seller accounts are reviewed by our team. You can set up your store once approved.</p>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" error={errors.password?.message} required>
            <Input icon={Lock} type="password" autoComplete="new-password" invalid={!!errors.password} {...register('password')} />
          </Field>
          <Field label="Confirm password" error={errors.confirm?.message} required>
            <Input icon={Lock} type="password" autoComplete="new-password" invalid={!!errors.confirm} {...register('confirm')} />
          </Field>
        </div>
        {registerUser.error && !registerUser.error.errors?.length && (
          <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700 ring-1 ring-red-200">{registerUser.error.message}</p>
        )}
        <Button type="submit" size="lg" className="w-full" loading={registerUser.isPending}>
          {role === 'SELLER' ? 'Submit seller application' : 'Create account'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-muted">
        Already have an account? <Link to="/login" className="font-semibold text-brand-600 hover:underline">Log in</Link>
      </p>
    </AuthLayout>
  );
}
