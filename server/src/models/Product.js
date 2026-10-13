import mongoose from 'mongoose';
import { round2 } from '../utils/money.js';

const variantSchema = new mongoose.Schema({
  sku: { type: String, default: '' },
  // e.g. { Size: 'M', Color: 'Black' }
  options: { type: Map, of: String, default: {} },
  // Optional MRP override for this variant; falls back to product price.
  price: { type: Number, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    shortDescription: { type: String, default: '' },
    description: { type: String, default: '' },
    images: { type: [String], default: [] },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    brand: { type: String, default: '', trim: true },
    price: { type: Number, required: true, min: 0 }, // MRP in INR
    discount: { type: Number, default: 0, min: 0, max: 90 }, // percent
    finalPrice: { type: Number, default: 0, index: true },
    sku: { type: String, default: '' },
    variants: { type: [variantSchema], default: [] },
    attributes: { type: [{ key: String, value: String, _id: false }], default: [] },
    stock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    moderationStatus: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING', index: true },
    moderationNote: { type: String, default: '' },
    tags: { type: [String], default: [] },
    seoKeywords: { type: [String], default: [] },
  },
  { timestamps: true },
);

productSchema.index({ name: 'text', brand: 'text', tags: 'text', shortDescription: 'text' }, { weights: { name: 10, brand: 5, tags: 4, shortDescription: 1 } });
productSchema.index({ moderationStatus: 1, status: 1, category: 1, finalPrice: 1 });
productSchema.index({ soldCount: -1 });
productSchema.index({ rating: -1 });

export const priceAfterDiscount = (mrp, discount) => round2(mrp * (1 - (discount || 0) / 100));

productSchema.pre('save', function computeDerived() {
  this.finalPrice = priceAfterDiscount(this.price, this.discount);
  if (this.variants?.length) {
    this.stock = this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  }
});

productSchema.set('toJSON', { flattenMaps: true, versionKey: false });

export const Product = mongoose.model('Product', productSchema);
