import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const addToCartSchema = z.object({
  productId: objectId,
  variantId: objectId.nullable().optional(),
  quantity: z.coerce.number().int().min(1).max(10).default(1),
});
export const updateCartSchema = z.object({ quantity: z.coerce.number().int().min(1).max(10) });

export const shippingAddressSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required').max(80),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  line1: z.string().trim().min(3, 'Address is required').max(150),
  line2: z.string().trim().max(150).optional().default(''),
  city: z.string().trim().min(2, 'City is required').max(60),
  state: z.string().trim().min(2, 'State is required').max(60),
  pincode: z.string().trim().regex(/^\d{6}$/, 'Enter a valid 6-digit PIN code'),
  country: z.string().trim().default('India'),
});

export const checkoutSchema = z.object({
  shippingAddress: shippingAddressSchema,
  couponCode: z.string().trim().max(30).optional().default(''),
  paymentMethod: z.enum(['CARD', 'UPI', 'NETBANKING', 'COD']).default('CARD'),
  simulateFailure: z.boolean().optional().default(false),
  saveAddress: z.boolean().optional().default(false),
});

export const previewSchema = z.object({ couponCode: z.string().trim().max(30).optional().default('') });

export const statusSchema = z.object({
  status: z.enum(['CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  note: z.string().trim().max(300).optional().default(''),
});
export const cancelSchema = z.object({ reason: z.string().trim().max(300).optional().default('') });

export const deliveryStatusSchema = z.object({
  status: z.enum(['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED']),
  note: z.string().trim().max(300).optional().default(''),
});

export const couponSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{3,20}$/, 'Use 3–20 letters or numbers'),
  description: z.string().trim().max(200).optional().default(''),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.coerce.number().positive('Value must be greater than 0'),
  minOrder: z.coerce.number().min(0).default(0),
  maxDiscount: z.coerce.number().min(0).default(0),
  expiresAt: z.coerce.date(),
  usageLimit: z.coerce.number().int().min(0).default(0),
  perUserLimit: z.coerce.number().int().min(0).default(1),
  isActive: z.boolean().default(true),
}).refine((c) => c.type !== 'PERCENTAGE' || c.value <= 90, { message: 'Percentage cannot exceed 90', path: ['value'] });

export const settlementStatusSchema = z.object({ status: z.enum(['PENDING', 'PROCESSED', 'ON_HOLD']), note: z.string().trim().max(200).optional().default('') });
