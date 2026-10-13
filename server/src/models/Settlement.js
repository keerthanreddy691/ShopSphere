import mongoose from 'mongoose';

const settlementSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    grossAmount: { type: Number, required: true },
    platformFeePercent: { type: Number, required: true },
    platformFee: { type: Number, required: true },
    refundAdjustment: { type: Number, default: 0 },
    netAmount: { type: Number, required: true },
    status: { type: String, enum: ['PENDING', 'PROCESSED', 'ON_HOLD', 'REVERSED'], default: 'PENDING', index: true },
    date: { type: Date, default: Date.now },
    processedAt: Date,
    note: { type: String, default: '' },
  },
  { timestamps: true },
);

export const Settlement = mongoose.model('Settlement', settlementSchema);
