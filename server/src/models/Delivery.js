import mongoose from 'mongoose';
import { addressSchema } from './User.js';

const deliverySchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    trackingNumber: { type: String, required: true, unique: true },
    agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pickupCity: { type: String, default: '' },
    dropAddress: { type: addressSchema },
    status: {
      type: String,
      enum: ['AWAITING_DISPATCH', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED'],
      default: 'AWAITING_DISPATCH',
      index: true,
    },
    history: [{ status: String, note: String, at: { type: Date, default: Date.now }, _id: false }],
    estimatedDelivery: Date,
    deliveredAt: Date,
    failureReason: { type: String, default: '' },
  },
  { timestamps: true },
);

export const Delivery = mongoose.model('Delivery', deliverySchema);
