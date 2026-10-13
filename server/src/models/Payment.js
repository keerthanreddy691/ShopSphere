import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    checkoutId: { type: String, required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    method: { type: String, enum: ['CARD', 'UPI', 'NETBANKING', 'COD'], default: 'CARD' },
    provider: { type: String, default: 'mock' },
    transactionId: { type: String, required: true },
    status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUND_PENDING', 'REFUNDED'], default: 'PENDING', index: true },
    refundAmount: { type: Number, default: 0 },
    refundReference: { type: String, default: '' },
    refundedAt: Date,
  },
  { timestamps: true },
);

export const Payment = mongoose.model('Payment', paymentSchema);
