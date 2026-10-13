import mongoose from 'mongoose';

const returnSchema = new mongoose.Schema(
  {
    returnNumber: { type: String, required: true, unique: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [
      {
        orderItem: { type: mongoose.Schema.Types.ObjectId, ref: 'OrderItem' },
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
        name: String,
        image: String,
        quantity: Number,
        amount: Number,
        _id: false,
      },
    ],
    reason: { type: String, required: true },
    description: { type: String, default: '' },
    images: { type: [String], default: [] },
    status: { type: String, enum: ['REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'REFUNDED'], default: 'REQUESTED', index: true },
    refundAmount: { type: Number, default: 0 },
    resolutionNote: { type: String, default: '' },
    history: [
      {
        status: String,
        note: String,
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: String,
        at: { type: Date, default: Date.now },
        _id: false,
      },
    ],
  },
  { timestamps: true },
);

export const Return = mongoose.model('Return', returnSchema);
