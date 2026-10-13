import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: {
      type: [
        {
          product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
          variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
          quantity: { type: Number, required: true, min: 1, max: 20 },
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);

export const Cart = mongoose.model('Cart', cartSchema);
