import { z } from 'zod';

export const addressSchema = z.object({
  fullName: z.string().trim().max(80).optional().default(''),
  phone: z.string().trim().max(20).optional().default(''),
  line1: z.string().trim().max(150).optional().default(''),
  line2: z.string().trim().max(150).optional().default(''),
  city: z.string().trim().max(60).optional().default(''),
  state: z.string().trim().max(60).optional().default(''),
  pincode: z.string().trim().max(10).optional().default(''),
  country: z.string().trim().max(60).optional().default('India'),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: z.string().trim().max(20).optional(),
  avatar: z.union([z.url(), z.literal('')]).optional(),
  address: addressSchema.optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').max(100),
});

export const createStaffSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().transform((v) => v.toLowerCase()),
  password: z.string().min(6).max(100),
  role: z.enum(['ADMIN', 'SUPPORT', 'DELIVERY']),
  phone: z.string().trim().max(20).optional().default(''),
});
