import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    image: { type: String, default: '' },
    sku: { type: String, default: '' },
    variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
    variantLabel: { type: String, default: '' },
    mrp: { type: Number, required: true },
    price: { type: Number, required: true }, // unit price paid (after product discount)
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true },
    returned: { type: Boolean, default: false },
    reviewed: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const OrderItem = mongoose.model('OrderItem', orderItemSchema);
