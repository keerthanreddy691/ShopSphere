import mongoose from 'mongoose';
import { addressSchema } from './User.js';

const sellerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    businessName: { type: String, required: true, trim: true },
    gstin: { type: String, default: '' },
    phone: { type: String, default: '' },
    businessAddress: { type: addressSchema, default: () => ({}) },
    description: { type: String, default: '' },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'], default: 'PENDING', index: true },
    rejectionReason: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
  },
  { timestamps: true },
);

export const Seller = mongoose.model('Seller', sellerSchema);
