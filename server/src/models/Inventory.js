import mongoose from 'mongoose';

// Stock movement ledger. Current stock lives on Product (and its variants) for atomic updates.
const inventorySchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    variantId: { type: mongoose.Schema.Types.ObjectId },
    type: { type: String, enum: ['INITIAL', 'RESTOCK', 'ADJUSTMENT', 'SALE', 'CANCELLATION', 'RETURN'], required: true },
    quantity: { type: Number, required: true }, // signed change
    stockAfter: { type: Number },
    reason: { type: String, default: '' },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export const Inventory = mongoose.model('Inventory', inventorySchema);
