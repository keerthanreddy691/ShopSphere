import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const url = z.url('Must be a valid URL');

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(300).optional().default(''),
  image: z.union([url, z.literal('')]).optional().default(''),
  icon: z.string().trim().max(40).optional().default('Package'),
  isActive: z.boolean().optional(),
});

export const variantSchema = z.object({
  _id: objectId.optional(),
  sku: z.string().trim().max(60).optional().default(''),
  options: z.record(z.string(), z.string().trim().min(1).max(40)),
  price: z.coerce.number().min(0).optional().nullable(),
  stock: z.coerce.number().int().min(0).max(100000),
});

export const productSchema = z.object({
  name: z.string().trim().min(3, 'Name must be at least 3 characters').max(150),
  shortDescription: z.string().trim().max(300).optional().default(''),
  description: z.string().trim().max(5000).optional().default(''),
  images: z.array(url).min(1, 'Add at least one image URL').max(8),
  category: objectId,
  brand: z.string().trim().max(60).optional().default(''),
  price: z.coerce.number().min(1, 'Price must be at least ₹1').max(10000000),
  discount: z.coerce.number().min(0).max(90).optional().default(0),
  sku: z.string().trim().max(60).optional().default(''),
  variants: z.array(variantSchema).max(50).optional().default([]),
  attributes: z.array(z.object({ key: z.string().trim().min(1).max(60), value: z.string().trim().min(1).max(200) })).max(40).optional().default([]),
  stock: z.coerce.number().int().min(0).max(100000).optional().default(0),
  lowStockThreshold: z.coerce.number().int().min(0).max(1000).optional().default(5),
  tags: z.array(z.string().trim().toLowerCase().min(1).max(40)).max(30).optional().default([]),
  seoKeywords: z.array(z.string().trim().max(60)).max(30).optional().default([]),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional().default('ACTIVE'),
});

export const productUpdateSchema = productSchema.partial();

export const storeSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(1000).optional().default(''),
  logo: z.union([url, z.literal('')]).optional().default(''),
  banner: z.union([url, z.literal('')]).optional().default(''),
  contactEmail: z.union([z.email(), z.literal('')]).optional().default(''),
  contactPhone: z.string().trim().max(20).optional().default(''),
  city: z.string().trim().max(60).optional().default(''),
});

export const moderationSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  note: z.string().trim().max(500).optional().default(''),
});

export const sellerReviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'SUSPENDED']),
  reason: z.string().trim().max(500).optional().default(''),
});

export const sellerProfileSchema = z.object({
  businessName: z.string().trim().min(2).max(100).optional(),
  gstin: z.string().trim().max(20).optional(),
  phone: z.string().trim().max(20).optional(),
  description: z.string().trim().max(1000).optional(),
});

export const stockUpdateSchema = z.object({
  stock: z.coerce.number().int().min(0).max(100000).optional(),
  variants: z.array(z.object({ _id: objectId, stock: z.coerce.number().int().min(0).max(100000) })).optional(),
  lowStockThreshold: z.coerce.number().int().min(0).max(1000).optional(),
  reason: z.string().trim().max(200).optional().default('Manual adjustment'),
});
