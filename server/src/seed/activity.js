import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { OrderItem } from '../models/OrderItem.js';
import { Payment } from '../models/Payment.js';
import { Delivery } from '../models/Delivery.js';
import { Settlement } from '../models/Settlement.js';
import { Return } from '../models/Return.js';
import { Review } from '../models/Review.js';
import { SupportTicket } from '../models/SupportTicket.js';
import { Notification } from '../models/Notification.js';
import { Product } from '../models/Product.js';
import { recomputeRating } from '../services/storeService.js';

export async function seedActivity({ users, stores, products }) {
  console.log('Seeding historical activity (orders, deliveries, settlements, reviews, returns, tickets)...');

  const prodByBrand = (brand) => products.find((p) => p.brand === brand && p.moderationStatus === 'APPROVED') || products[0];
  const prodByName = (partial) => products.find((p) => p.name.toLowerCase().includes(partial.toLowerCase()) && p.moderationStatus === 'APPROVED') || products[0];

  const pIphone = prodByName('iPhone 15');
  const pSony = prodByName('WH-1000XM5');
  const pNike = prodByName('Nike Revolution 7');
  const pSkechers = prodByName('Go Walk Max');
  const pChair = prodByName('Armchair');
  const pCoffee = prodByName('Blue Tokai');
  const pAtomic = prodByName('Atomic Habits');

  const customerAddress = users.customer.address;
  const c2Address = users.c2.address;

  // Helper to create an order, order items, payment, delivery, and settlement
  const createSeededOrder = async ({
    orderNumber,
    checkoutId,
    customer,
    seller,
    store,
    items,
    status,
    paymentMethod = 'UPI',
    paymentStatus = 'SUCCESS',
    deliveryStatus = 'DELIVERED',
    daysAgo = 3,
  }) => {
    const createdAt = new Date(Date.now() - daysAgo * 86400000);
    const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
    const shippingFee = subtotal > 1000 ? 0 : 50;
    const total = subtotal + shippingFee;
    const platformFee = Math.round((total * 0.05) * 100) / 100;
    const sellerEarning = Math.round((total - platformFee) * 100) / 100;

    const order = await Order.create({
      orderNumber,
      checkoutId,
      customer: customer._id,
      seller: seller._id,
      store: store._id,
      itemCount: items.reduce((s, it) => s + it.quantity, 0),
      subtotal,
      shippingFee,
      discount: 0,
      total,
      shippingAddress: customer.address || customerAddress,
      status,
      paymentMethod,
      paymentStatus,
      platformFee,
      sellerEarning,
      deliveredAt: ['DELIVERED', 'RETURN_REQUESTED', 'RETURNED', 'REFUNDED'].includes(status) ? new Date(createdAt.getTime() + 86400000) : null,
      createdAt,
      statusHistory: [
        { status: 'PLACED', note: 'Order placed', by: customer._id, role: 'CUSTOMER', at: createdAt },
        ...(status !== 'PLACED' ? [{ status: 'CONFIRMED', note: 'Order confirmed', by: seller._id, role: 'SELLER', at: new Date(createdAt.getTime() + 3600000) }] : []),
        ...(status === 'DELIVERED' || status === 'SHIPPED' || status === 'RETURN_REQUESTED' ? [{ status: 'SHIPPED', note: 'Handed to courier', by: seller._id, role: 'SELLER', at: new Date(createdAt.getTime() + 10000000) }] : []),
        ...(['DELIVERED', 'RETURN_REQUESTED', 'RETURNED', 'REFUNDED'].includes(status) ? [{ status: 'DELIVERED', note: 'Delivered successfully', by: users.delivery._id, role: 'DELIVERY', at: new Date(createdAt.getTime() + 86400000) }] : []),
      ],
    });

    const orderItems = [];
    for (const it of items) {
      const oi = await OrderItem.create({
        order: order._id,
        product: it.product._id,
        seller: seller._id,
        customer: customer._id,
        name: it.product.name,
        image: it.product.images[0] || '',
        sku: it.product.sku,
        variantId: null,
        variantLabel: it.variantLabel || '',
        mrp: it.product.price,
        price: it.price,
        quantity: it.quantity,
        lineTotal: it.price * it.quantity,
        createdAt,
      });
      orderItems.push(oi);
    }

    order.items = orderItems.map((oi) => oi._id);

    // Payment
    const payment = await Payment.create({
      order: order._id,
      customer: customer._id,
      amount: total,
      method: paymentMethod,
      status: paymentStatus,
      transactionId: `TXN-${orderNumber}`,
      paidAt: paymentStatus === 'SUCCESS' ? createdAt : null,
      createdAt,
    });
    order.payment = payment._id;

    // Delivery
    const delivery = await Delivery.create({
      order: order._id,
      customer: customer._id,
      seller: seller._id,
      agent: users.delivery._id,
      trackingNumber: `TRK-${orderNumber}`,
      status: deliveryStatus,
      deliveredAt: deliveryStatus === 'DELIVERED' ? new Date(createdAt.getTime() + 86400000) : null,
      history: [{ status: deliveryStatus, note: 'Delivery update', at: createdAt }],
      createdAt,
    });
    order.delivery = delivery._id;

    await order.save();

    // Settlement
    if (['DELIVERED', 'RETURN_REQUESTED'].includes(status)) {
      await Settlement.create({
        seller: seller._id,
        order: order._id,
        grossAmount: total,
        platformFeePercent: 5,
        platformFee,
        netAmount: sellerEarning,
        status: daysAgo > 4 ? 'PROCESSED' : 'PENDING',
        date: createdAt,
        processedAt: daysAgo > 4 ? new Date(createdAt.getTime() + 172800000) : null,
      });
    }

    return { order, orderItems, payment, delivery };
  };

  // 1. Order 1: TechNova order for Priya Sharma (DELIVERED, 4 days ago)
  const o1 = await createSeededOrder({
    orderNumber: 'ORD-10001',
    checkoutId: 'CHK-9001',
    customer: users.customer,
    seller: users.seller,
    store: stores.seller,
    items: [{ product: pSony, price: Math.round(pSony.price * (1 - pSony.discount / 100)), quantity: 1 }],
    status: 'DELIVERED',
    deliveryStatus: 'DELIVERED',
    daysAgo: 4,
  });

  // 2. Order 2: UrbanThreads order for Priya Sharma (DELIVERED, 3 days ago)
  const o2 = await createSeededOrder({
    orderNumber: 'ORD-10002',
    checkoutId: 'CHK-9002',
    customer: users.customer,
    seller: users.seller2,
    store: stores.seller2,
    items: [{ product: pNike, price: Math.round(pNike.price * (1 - pNike.discount / 100)), quantity: 1, variantLabel: 'Size: UK 8' }],
    status: 'DELIVERED',
    deliveryStatus: 'DELIVERED',
    daysAgo: 3,
  });

  // 3. Order 3: Multi-vendor checkout for Rahul Verma (CHK-9003) -> TechNova & UrbanThreads
  const o3_a = await createSeededOrder({
    orderNumber: 'ORD-10003',
    checkoutId: 'CHK-9003',
    customer: users.c2,
    seller: users.seller,
    store: stores.seller,
    items: [{ product: pIphone, price: Math.round(pIphone.price * (1 - pIphone.discount / 100)), quantity: 1 }],
    status: 'SHIPPED',
    deliveryStatus: 'OUT_FOR_DELIVERY',
    daysAgo: 1,
  });

  const o3_b = await createSeededOrder({
    orderNumber: 'ORD-10004',
    checkoutId: 'CHK-9003',
    customer: users.c2,
    seller: users.seller2,
    store: stores.seller2,
    items: [{ product: pSkechers, price: Math.round(pSkechers.price * (1 - pSkechers.discount / 100)), quantity: 1, variantLabel: 'Size: UK 9' }],
    status: 'CONFIRMED',
    deliveryStatus: 'ASSIGNED',
    daysAgo: 1,
  });

  // 4. Order 4: HomeNest Living order for Meera Nair (DELIVERED, 5 days ago)
  const o4 = await createSeededOrder({
    orderNumber: 'ORD-10005',
    checkoutId: 'CHK-9004',
    customer: users.c3,
    seller: users.seller3,
    store: stores.seller3,
    items: [
      { product: pCoffee, price: Math.round(pCoffee.price * (1 - pCoffee.discount / 100)), quantity: 2 },
      { product: pAtomic, price: Math.round(pAtomic.price * (1 - pAtomic.discount / 100)), quantity: 1 },
    ],
    status: 'DELIVERED',
    deliveryStatus: 'DELIVERED',
    daysAgo: 5,
  });

  // 5. Order 5: Return requested order for Aditya Rao
  const o5 = await createSeededOrder({
    orderNumber: 'ORD-10006',
    checkoutId: 'CHK-9005',
    customer: users.c4,
    seller: users.seller2,
    store: stores.seller2,
    items: [{ product: pNike, price: Math.round(pNike.price * (1 - pNike.discount / 100)), quantity: 1, variantLabel: 'Size: UK 9' }],
    status: 'RETURN_REQUESTED',
    deliveryStatus: 'DELIVERED',
    daysAgo: 2,
  });

  console.log('✓ 6 seeded orders with multi-vendor checkouts');

  // Seed Return
  await Return.create({
    returnNumber: 'RET-88001',
    order: o5.order._id,
    customer: users.c4._id,
    seller: users.seller2._id,
    items: [{
      orderItem: o5.orderItems[0]._id,
      product: pNike._id,
      name: pNike.name,
      image: pNike.images[0] || '',
      quantity: 1,
      amount: o5.orderItems[0].lineTotal,
    }],
    reason: 'Size did not fit as expected',
    description: 'Shoes are slightly narrower than usual. Requesting return and refund.',
    status: 'REQUESTED',
    refundAmount: o5.order.total,
    history: [{ status: 'REQUESTED', note: 'Size did not fit', by: users.c4._id, role: 'CUSTOMER', at: new Date() }],
  });
  console.log('✓ 1 return request');

  // Seed Reviews for Delivered orders
  const r1 = await Review.create({
    product: pSony._id,
    customer: users.customer._id,
    order: o1.order._id,
    orderItem: o1.orderItems[0]._id,
    rating: 5,
    title: 'Incredible sound and active noise cancellation!',
    comment: 'The noise cancelling on these headphones is absolute magic. Battery lasts for days on a single charge and they are super lightweight.',
    verifiedPurchase: true,
    status: 'PUBLISHED',
  });
  await OrderItem.updateOne({ _id: o1.orderItems[0]._id }, { reviewed: true });

  const r2 = await Review.create({
    product: pNike._id,
    customer: users.customer._id,
    order: o2.order._id,
    orderItem: o2.orderItems[0]._id,
    rating: 4,
    title: 'Very comfortable running shoes',
    comment: 'Great cushioning for regular morning runs. The red color looks vibrant. Fits true to size.',
    verifiedPurchase: true,
    status: 'PUBLISHED',
  });
  await OrderItem.updateOne({ _id: o2.orderItems[0]._id }, { reviewed: true });

  const r3 = await Review.create({
    product: pCoffee._id,
    customer: users.c3._id,
    order: o4.order._id,
    orderItem: o4.orderItems[0]._id,
    rating: 5,
    title: 'Best artisan coffee in India',
    comment: 'Freshly roasted whole beans with rich chocolate and citrus notes. Tastes amazing on French press!',
    verifiedPurchase: true,
    status: 'PUBLISHED',
  });
  await OrderItem.updateOne({ _id: o4.orderItems[0]._id }, { reviewed: true });

  // Update Product ratings
  await Product.updateOne({ _id: pSony._id }, { rating: 5, reviewCount: 1 });
  await Product.updateOne({ _id: pNike._id }, { rating: 4.5, reviewCount: 2 });
  await Product.updateOne({ _id: pCoffee._id }, { rating: 4.8, reviewCount: 1 });

  await recomputeRating(stores.seller._id);
  await recomputeRating(stores.seller2._id);
  await recomputeRating(stores.seller3._id);
  console.log('✓ Seeded customer reviews and updated product/store ratings');

  // Seed Support Tickets
  await SupportTicket.create({
    ticketNumber: 'TCK-55001',
    customer: users.customer._id,
    order: o1.order._id,
    subject: 'Warranty registration inquiry',
    category: 'ORDER',
    priority: 'LOW',
    status: 'RESOLVED',
    assignedTo: users.support._id,
    messages: [
      {
        sender: users.customer._id,
        senderRole: 'CUSTOMER',
        message: 'Hi, where can I download the official GST invoice for Sony warranty registration?',
        at: new Date(Date.now() - 3 * 86400000),
      },
      {
        sender: users.support._id,
        senderRole: 'SUPPORT',
        message: 'Hello Priya! You can view and print your order invoice directly under My Orders -> Order Details. Let us know if you need anything else.',
        at: new Date(Date.now() - 2 * 86400000),
      },
    ],
  });

  await SupportTicket.create({
    ticketNumber: 'TCK-55002',
    customer: users.c2._id,
    order: o3_a.order._id,
    subject: 'Request delivery time slot for iPhone package',
    category: 'DELIVERY',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    assignedTo: users.support._id,
    messages: [
      {
        sender: users.c2._id,
        senderRole: 'CUSTOMER',
        message: 'Hello, I will be available at home only after 4 PM today. Can the delivery executive deliver after 4 PM?',
        at: new Date(Date.now() - 5 * 3600000),
      },
      {
        sender: users.support._id,
        senderRole: 'SUPPORT',
        message: 'Hi Rahul, we have notified our delivery partner Arjun Das with your preferred slot after 4 PM.',
        at: new Date(Date.now() - 2 * 3600000),
      },
    ],
  });

  await SupportTicket.create({
    ticketNumber: 'TCK-55003',
    customer: users.c4._id,
    subject: 'Return status update',
    category: 'RETURN',
    priority: 'MEDIUM',
    status: 'OPEN',
    messages: [
      {
        sender: users.c4._id,
        senderRole: 'CUSTOMER',
        message: 'I submitted a return request for ORD-10006 yesterday. When will the pickup be scheduled?',
        at: new Date(Date.now() - 1 * 3600000),
      },
    ],
  });
  console.log('✓ 3 support tickets with active conversations');

  // Additional notifications
  await Notification.insertMany([
    {
      user: users.seller._id,
      type: 'ORDER_PLACED',
      title: 'New order received · ORD-10003',
      message: 'Apple iPhone 15 ordered by Rahul Verma.',
      link: `/seller/orders/${o3_a.order._id}`,
    },
    {
      user: users.seller2._id,
      type: 'RETURN_REQUESTED',
      title: 'Return requested · ORD-10006',
      message: 'Customer requested return: Size did not fit as expected',
      link: '/seller/returns',
    },
    {
      user: users.delivery._id,
      type: 'DELIVERY_ASSIGNED',
      title: 'Delivery out for delivery · TRK-ORD-10003',
      message: 'Deliver package to Rahul Verma in Kolkata.',
      link: '/delivery',
    },
    {
      user: users.customer._id,
      type: 'ORDER_DELIVERED',
      title: 'Order delivered · ORD-10001',
      message: 'Your Sony WH-1000XM5 has been delivered. Share your review!',
      link: `/account/orders/${o1.order._id}`,
    },
  ]);
  console.log('✓ Role notifications seeded');
}
