import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.email('Enter a valid email').transform((v) => v.toLowerCase()),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  phone: z.string().trim().max(20).optional().default(''),
  role: z.enum(['CUSTOMER', 'SELLER']).default('CUSTOMER'),
  businessName: z.string().trim().max(100).optional(),
  gstin: z.string().trim().max(20).optional(),
}).refine((d) => d.role !== 'SELLER' || (d.businessName && d.businessName.length >= 2), {
  message: 'Business name is required for sellers',
  path: ['businessName'],
});

export const loginSchema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
