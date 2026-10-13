import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { User, MapPin, Lock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { patch } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, Field } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { ImageUploadButton } from '@/components/common/ImageUploadButton';

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number').optional().or(z.literal('')),
  fullName: z.string().trim().optional(),
  line1: z.string().trim().optional(),
  line2: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  pincode: z.string().trim().regex(/^\d{6}$/, 'Enter a 6-digit PIN code').optional().or(z.literal('')),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your new password'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export default function ProfilePage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const {
    register: regProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm({ resolver: zodResolver(profileSchema) });

  const {
    register: regPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm({ resolver: zodResolver(passwordSchema) });

  useEffect(() => {
    if (user) {
      const a = user.address || {};
      resetProfile({
        name: user.name || '',
        phone: user.phone || '',
        fullName: a.fullName || user.name || '',
        line1: a.line1 || '',
        line2: a.line2 || '',
        city: a.city || '',
        state: a.state || '',
        pincode: a.pincode || '',
      });
    }
  }, [user, resetProfile]);

  const updateProfile = useMutation({
    mutationFn: (data) =>
      patch('/users/profile', {
        name: data.name,
        phone: data.phone,
        address: {
          fullName: data.fullName || data.name,
          phone: data.phone,
          line1: data.line1,
          line2: data.line2,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
        },
      }),
    onSuccess: (res) => {
      toast.success(res.message || 'Profile updated successfully');
      qc.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const updateAvatar = useMutation({
    mutationFn: (avatar) => patch('/users/profile', { avatar }),
    onSuccess: () => {
      toast.success('Profile photo updated');
      qc.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const changePassword = useMutation({
    mutationFn: (data) =>
      patch('/users/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    onSuccess: (res) => {
      toast.success(res.message || 'Password changed successfully');
      resetPassword();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Personal Profile</h1>
        <p className="mt-1 text-sm text-ink-muted">Manage your personal information and delivery preferences.</p>
      </div>

      <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <Avatar name={user?.name} src={user?.avatar} className="size-16" />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold">{user?.name}</h2>
          <p className="text-sm text-ink-muted">{user?.email}</p>
          <span className="mt-1 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
            {user?.role} Account
          </span>
        </div>
        <ImageUploadButton folder="avatars" label="Change photo" loading={updateAvatar.isPending} onUploaded={([url]) => updateAvatar.mutate(url)} />
      </div>

      <form onSubmit={handleProfileSubmit((d) => updateProfile.mutate(d))} className="space-y-6">
        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <User className="size-5 text-brand-600" /> Basic Details
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" error={profileErrors.name?.message} required>
              <Input {...regProfile('name')} invalid={!!profileErrors.name} />
            </Field>
            <Field label="Phone number" error={profileErrors.phone?.message}>
              <Input {...regProfile('phone')} invalid={!!profileErrors.phone} />
            </Field>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <MapPin className="size-5 text-brand-600" /> Default Shipping Address
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Contact Person" className="sm:col-span-2">
              <Input {...regProfile('fullName')} />
            </Field>
            <Field label="House no., Street address" className="sm:col-span-2">
              <Input {...regProfile('line1')} />
            </Field>
            <Field label="Landmark, Area" className="sm:col-span-2">
              <Input {...regProfile('line2')} />
            </Field>
            <Field label="City">
              <Input {...regProfile('city')} />
            </Field>
            <Field label="State">
              <Input {...regProfile('state')} />
            </Field>
            <Field label="PIN Code" error={profileErrors.pincode?.message}>
              <Input {...regProfile('pincode')} maxLength={6} invalid={!!profileErrors.pincode} />
            </Field>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg" loading={updateProfile.isPending}>
            Save Changes
          </Button>
        </div>
      </form>

      {/* Change Password */}
      <Card className="p-5 sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
          <Lock className="size-5 text-brand-600" /> Change Password
        </h2>
        <form
          onSubmit={handlePasswordSubmit((d) => changePassword.mutate(d))}
          className="grid max-w-lg gap-4"
        >
          <Field label="Current password" error={passwordErrors.currentPassword?.message} required>
            <Input type="password" {...regPassword('currentPassword')} invalid={!!passwordErrors.currentPassword} />
          </Field>
          <Field label="New password" error={passwordErrors.newPassword?.message} required>
            <Input type="password" {...regPassword('newPassword')} invalid={!!passwordErrors.newPassword} />
          </Field>
          <Field label="Confirm new password" error={passwordErrors.confirmPassword?.message} required>
            <Input type="password" {...regPassword('confirmPassword')} invalid={!!passwordErrors.confirmPassword} />
          </Field>
          <div>
            <Button type="submit" variant="outline" loading={changePassword.isPending}>
              Update Password
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

