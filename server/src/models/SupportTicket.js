import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: String,
    message: { type: String, required: true, maxlength: 3000 },
    at: { type: Date, default: Date.now },
  },
  { _id: true },
);

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    subject: { type: String, required: true, maxlength: 150 },
    category: { type: String, enum: ['ORDER', 'PAYMENT', 'DELIVERY', 'RETURN', 'PRODUCT', 'ACCOUNT', 'DISPUTE', 'OTHER'], default: 'OTHER' },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], default: 'MEDIUM' },
    messages: { type: [messageSchema], default: [] },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'RESOLVED', 'CLOSED'], default: 'OPEN', index: true },
  },
  { timestamps: true },
);

export const SupportTicket = mongoose.model('SupportTicket', ticketSchema);
