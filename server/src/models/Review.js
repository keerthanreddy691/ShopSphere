import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    orderItem: { type: mongoose.Schema.Types.ObjectId, ref: 'OrderItem', required: true, unique: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: '', maxlength: 120 },
    comment: { type: String, default: '', maxlength: 2000 },
    images: { type: [String], default: [] },
    verifiedPurchase: { type: Boolean, default: true },
    status: { type: String, enum: ['PUBLISHED', 'HIDDEN'], default: 'PUBLISHED', index: true },
    ai: {
      label: { type: String, enum: ['NORMAL', 'SPAM', 'ABUSIVE', 'SUSPICIOUS'], default: 'NORMAL' },
      confidence: { type: Number, default: 0 },
      reason: { type: String, default: '' },
      source: { type: String, default: 'fallback' },
    },
  },
  { timestamps: true },
);

export const Review = mongoose.model('Review', reviewSchema);
