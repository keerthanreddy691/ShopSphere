import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  Store,
  MapPin,
  CreditCard,
  Truck,
  RotateCcw,
  Star,
  Ban,
  ArrowLeft,
  Calendar,
  Phone,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { get, post } from '@/lib/api';
import { useMyOrder, useCancelOrder } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog } from '@/components/ui/dialog';
import { Input, Textarea, Field, Select } from '@/components/ui/input';
import { StatusBadge } from '@/components/common/StatusBadge';
import { OrderTimeline } from '@/components/common/OrderTimeline';
import { ErrorState } from '@/components/common/ErrorState';
import { SafeImage } from '@/components/common/SafeImage';
import { Stars } from '@/components/common/Rating';
import { formatDate, formatDateTime, formatPrice, titleCase } from '@/lib/format';

const RETURN_REASONS = [
  'Defective or damaged product',
  'Item does not match description',
  'Size or fit is incorrect',
  'Received wrong item',
  'Missing parts or accessories',
  'Quality not as expected',
  'Other',
];

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: order, isLoading, isError, error, refetch } = useMyOrder(orderId);
  const cancelMutation = useCancelOrder();

  // Cancel dialog
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Return dialog
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnReason, setReturnReason] = useState(RETURN_REASONS[0]);
  const [returnDescription, setReturnDescription] = useState('');

  // Review dialog
  const [reviewItem, setReviewItem] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');

  const submitReturn = useMutation({
    mutationFn: () =>
      post('/returns', {
        orderId: order._id,
        reason: returnReason,
        description: returnDescription,
      }),
    onSuccess: () => {
      toast.success('Return request submitted successfully');
      setReturnOpen(false);
      qc.invalidateQueries({ queryKey: ['my-order', orderId] });
      qc.invalidateQueries({ queryKey: ['my-orders'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const submitReview = useMutation({
    mutationFn: () =>
      post('/reviews', {
        orderId: order._id,
        orderItemId: reviewItem._id,
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment,
      }),
    onSuccess: () => {
      toast.success('Thank you for submitting your review!');
      setReviewItem(null);
      setReviewTitle('');
      setReviewComment('');
      qc.invalidateQueries({ queryKey: ['my-order', orderId] });
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return <ErrorState error={error || new Error('Order not found')} onRetry={refetch} />;
  }

  const addr = order.shippingAddress || {};

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/account/orders" className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink">
            <ArrowLeft className="size-3.5" /> Back to My Orders
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            Placed on {formatDateTime(order.createdAt)} · Checkout ID: <span className="font-mono">{order.checkoutId}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {order.canCancel && (
            <Button
              variant="outline"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => setCancelOpen(true)}
            >
              <Ban className="size-4" /> Cancel order
            </Button>
          )}

          {order.canReturn && (
            <Button variant="outline" onClick={() => setReturnOpen(true)}>
              <RotateCcw className="size-4" /> Request return
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left Column: Items & Timeline */}
        <div className="space-y-6">
          {/* Order Items */}
          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-3">
              <Link to={`/store/${order.store?.slug}`} className="flex items-center gap-2 text-sm font-semibold hover:text-brand-600">
                <Store className="size-4 text-ink-muted" /> Sold by {order.store?.name || 'Seller'}
              </Link>
            </div>
            <ul className="divide-y divide-slate-100 p-5">
              {order.items.map((item) => (
                <li key={item._id} className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                  <SafeImage src={item.image} alt={item.name} className="size-20 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/product/${item.product?.slug || item.product}`} className="font-semibold text-ink hover:text-brand-600">
                      {item.name}
                    </Link>
                    {item.variantLabel && <p className="mt-0.5 text-xs text-ink-muted">{item.variantLabel}</p>}
                    <p className="mt-1 text-xs text-ink-muted">
                      Qty: {item.quantity} × {formatPrice(item.price)}
                      {item.returned && <span className="ml-2 font-semibold text-amber-600">(Returned)</span>}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-base font-bold">{formatPrice(item.lineTotal)}</p>
                    {order.status === 'DELIVERED' && !item.returned && (
                      item.reviewRating ? (
                        <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                          <Stars value={item.reviewRating} size="sm" />
                          <span>Rated</span>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 text-xs text-brand-600 hover:bg-brand-50"
                          onClick={() => {
                            setReviewItem(item);
                            setReviewRating(5);
                          }}
                        >
                          <Star className="size-3.5" /> Rate item
                        </Button>
                      )
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          {/* Timeline & Status History */}
          <Card className="p-5 sm:p-6">
            <h2 className="mb-5 text-base font-semibold">Order progress</h2>
            <OrderTimeline status={order.status} history={order.statusHistory} />
          </Card>

          {/* Delivery Details */}
          {order.delivery && (
            <Card className="p-5">
              <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
                <Truck className="size-5 text-brand-600" /> Delivery status
              </h2>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs text-ink-muted">Tracking number</p>
                  <p className="font-mono font-medium">{order.delivery.trackingNumber || 'Assigned'}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">Current status</p>
                  <StatusBadge status={order.delivery.status} />
                </div>
                {order.delivery.agent && (
                  <div>
                    <p className="text-xs text-ink-muted">Delivery partner</p>
                    <p className="font-medium">{order.delivery.agent.name}</p>
                    {order.delivery.agent.phone && (
                      <p className="flex items-center gap-1 text-xs text-ink-muted">
                        <Phone className="size-3" /> {order.delivery.agent.phone}
                      </p>
                    )}
                  </div>
                )}
                {order.delivery.deliveredAt && (
                  <div>
                    <p className="text-xs text-ink-muted">Delivered on</p>
                    <p className="font-medium">{formatDateTime(order.delivery.deliveredAt)}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Return status banner if returned */}
          {order.returns?.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/50 p-5">
              <div className="flex items-start gap-3">
                <RotateCcw className="mt-0.5 size-5 text-amber-700" />
                <div>
                  <h3 className="font-semibold text-amber-900">Return request: {order.returns[0].returnNumber}</h3>
                  <p className="mt-1 text-sm text-amber-800">
                    Status: <span className="font-semibold">{titleCase(order.returns[0].status)}</span> · Reason: {order.returns[0].reason}
                  </p>
                  {order.returns[0].refundAmount > 0 && (
                    <p className="mt-1 text-xs text-amber-700">Refund amount: {formatPrice(order.returns[0].refundAmount)}</p>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Address & Price Breakdown */}
        <div className="space-y-6">
          {/* Price Breakdown */}
          <Card className="p-5">
            <h2 className="text-base font-semibold">Payment summary</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Subtotal ({order.itemCount} items)</dt>
                <dd className="font-medium">{formatPrice(order.subtotal)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <dt>Coupon discount</dt>
                  <dd>− {formatPrice(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-ink-soft">Delivery</dt>
                <dd className="font-medium">{order.shippingFee ? formatPrice(order.shippingFee) : 'Free'}</dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold">
                <dt>Total paid</dt>
                <dd>{formatPrice(order.total)}</dd>
              </div>
            </dl>

            <div className="mt-4 border-t border-slate-100 pt-3 text-xs">
              <p className="flex items-center gap-1.5 font-medium text-ink-soft">
                <CreditCard className="size-4 text-ink-muted" /> {titleCase(order.paymentMethod)} payment
              </p>
              <p className="mt-1 flex items-center gap-2">
                <span className="text-ink-muted">Payment status:</span>
                <StatusBadge status={order.paymentStatus} />
              </p>
            </div>
          </Card>

          {/* Delivery Address */}
          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <MapPin className="size-4 text-brand-600" /> Delivery address
            </h2>
            <div className="mt-3 text-sm">
              <p className="font-semibold">{addr.fullName || 'Customer'}</p>
              <p className="mt-1 text-ink-muted">
                {[addr.line1, addr.line2, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}
              </p>
              {addr.phone && <p className="mt-2 text-xs text-ink-muted">Phone: {addr.phone}</p>}
            </div>
          </Card>

          {/* Need help */}
          <Card className="p-5 text-center">
            <p className="text-sm font-semibold">Need help with this order?</p>
            <p className="mt-1 text-xs text-ink-muted">Our customer support team is available 24/7 to resolve issues.</p>
            <Link to="/account/support">
              <Button variant="outline" size="sm" className="mt-3 w-full">
                Contact Support
              </Button>
            </Link>
          </Card>
        </div>
      </div>

      {/* Cancel Order Dialog */}
      <Dialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel Order"
        description="Are you sure you want to cancel this order? Any payment made will be refunded automatically."
        footer={
          <>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Keep Order
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              loading={cancelMutation.isPending}
              onClick={() => {
                cancelMutation.mutate(
                  { id: order._id, reason: cancelReason },
                  { onSuccess: () => setCancelOpen(false) },
                );
              }}
            >
              Confirm Cancellation
            </Button>
          </>
        }
      >
        <Field label="Cancellation reason (optional)">
          <Input
            placeholder="e.g. Ordered by mistake, bought elsewhere"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </Field>
      </Dialog>

      {/* Return Request Dialog */}
      <Dialog
        open={returnOpen}
        onClose={() => setReturnOpen(false)}
        title="Request Return"
        description="Submit a return request within the 7-day window. The seller will review and arrange pickup."
        footer={
          <>
            <Button variant="outline" onClick={() => setReturnOpen(false)}>
              Cancel
            </Button>
            <Button loading={submitReturn.isPending} onClick={() => submitReturn.mutate()}>
              Submit Return Request
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Reason for return" required>
            <Select value={returnReason} onChange={(e) => setReturnReason(e.target.value)}>
              {RETURN_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Additional details" hint="Describe the issue with the item">
            <Textarea
              rows={3}
              placeholder="Provide any details to help the seller process your return faster"
              value={returnDescription}
              onChange={(e) => setReturnDescription(e.target.value)}
            />
          </Field>
        </div>
      </Dialog>

      {/* Write Review Dialog */}
      <Dialog
        open={Boolean(reviewItem)}
        onClose={() => setReviewItem(null)}
        title={`Review ${reviewItem?.name || 'Product'}`}
        description="Share your feedback to help other buyers on ShopSphere."
        footer={
          <>
            <Button variant="outline" onClick={() => setReviewItem(null)}>
              Cancel
            </Button>
            <Button loading={submitReview.isPending} onClick={() => submitReview.mutate()}>
              Submit Review
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Your rating">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setReviewRating(s)}
                  className="rounded-lg p-1.5 transition hover:bg-slate-100"
                >
                  <Star
                    className={`size-6 ${
                      s <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </Field>
          <Field label="Review title" hint="Summarize your experience">
            <Input
              placeholder="e.g. Great quality, worth every rupee!"
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
            />
          </Field>
          <Field label="Detailed comment" required>
            <Textarea
              rows={4}
              placeholder="What did you like or dislike? How was the quality and fit?"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
            />
          </Field>
        </div>
      </Dialog>
    </div>
  );
}

