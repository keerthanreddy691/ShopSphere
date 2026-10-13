import crypto from 'node:crypto';

// Simulated gateway used for the capstone demo. It mimics the shape of a real provider
// (Razorpay/Stripe) so a real integration can replace it without touching checkout code.
const txn = (prefix) => `${prefix}_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

export const mockProvider = {
  name: 'mock',
  async charge({ amount, method, simulateFailure }) {
    await new Promise((r) => setTimeout(r, 300)); // network latency
    if (simulateFailure) return { success: false, failureReason: 'Payment declined by issuing bank (simulated)' };
    if (method === 'COD') return { success: true, pending: true, transactionId: txn('COD') };
    return { success: true, transactionId: txn('pay'), amount };
  },
  async refund({ transactionId, amount }) {
    await new Promise((r) => setTimeout(r, 150));
    return { success: true, refundReference: txn('rfnd'), transactionId, amount };
  },
};
