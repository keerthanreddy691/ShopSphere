import mongoose from 'mongoose';
import { addressSchema } from './User.js';

const historySchema = new mongoose.Schema(
  {
    status: String,
    note: { type: String, default: '' },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: String,
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

// One Order per seller. All orders created by one checkout share `checkoutId`.
const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    checkoutId: { type: String, required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'OrderItem' }],
    itemCount: { type: Number, default: 0 },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    total: { type: Number, required: true },
    couponCode: { type: String, default: '' },
    shippingAddress: { type: addressSchema, required: true },
    status: {
      type: String,
      enum: ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED', 'REFUNDED'],
      default: 'PLACED',
      index: true,
    },
    statusHistory: { type: [historySchema], default: [] },
    paymentStatus: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUND_PENDING', 'REFUNDED'], default: 'PENDING' },
    paymentMethod: { type: String, default: 'CARD' },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    delivery: { type: mongoose.Schema.Types.ObjectId, ref: 'Delivery' },
    platformFee: { type: Number, default: 0 },
    sellerEarning: { type: Number, default: 0 },
    cancelReason: { type: String, default: '' },
    deliveredAt: Date,
  },
  { timestamps: true },
);

orderSchema.index({ seller: 1, status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

export const Order = mongoose.model('Order', orderSchema);
