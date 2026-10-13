import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const addressSchema = new mongoose.Schema(
  {
    fullName: String,
    phone: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['CUSTOMER', 'SELLER', 'ADMIN', 'SUPPORT', 'DELIVERY'], default: 'CUSTOMER', index: true },
    avatar: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: addressSchema, default: () => ({}) },
    isActive: { type: Boolean, default: true },
    recentlyViewed: {
      type: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, viewedAt: Date, _id: false }],
      default: [],
      select: false,
    },
    lastLoginAt: Date,
  },
  { timestamps: true },
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.recentlyViewed;
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.model('User', userSchema);
