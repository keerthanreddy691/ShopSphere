import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User, Seller, Store, Category, Product, Inventory, Coupon, Notification } from '../models/index.js';
import { slugify } from '../utils/slugify.js';
import * as data from './data.js';
import { seedActivity } from './activity.js';

async function run() {
  await connectDB();
  console.log('Dropping existing database…');
  await mongoose.connection.db.dropDatabase();
  await Promise.all(mongoose.modelNames().map((n) => mongoose.model(n).syncIndexes()));

  // Users
  const users = {};
  for (const u of data.users) {
    const { key, ...rest } = u;
    users[key] = await User.create({ ...rest, password: data.DEMO_PASSWORD });
  }
  console.log(`✓ ${Object.keys(users).length} users`);

  // Sellers & stores
  for (const [key, s] of Object.entries(data.sellers)) {
    await Seller.create({
      user: users[key]._id,
      ...s,
      phone: users[key].phone,
      reviewedBy: s.status === 'APPROVED' ? users.admin._id : undefined,
      reviewedAt: s.status === 'APPROVED' ? new Date() : undefined,
    });
  }
  const stores = {};
  for (const [key, s] of Object.entries(data.stores)) {
    stores[key] = await Store.create({ ...s, slug: slugify(s.name), seller: users[key]._id });
  }
  console.log(`✓ ${Object.keys(stores).length} stores`);

  // Categories
  const categories = {};
  for (const c of data.categories) {
    categories[c.name] = await Category.create({ ...c, slug: slugify(c.name) });
  }
  console.log(`✓ ${data.categories.length} categories`);

  // Products
  const build = (p, moderationStatus) => ({
    name: p.name,
    slug: slugify(p.name),
    brand: p.brand,
    price: p.price,
    discount: p.discount,
    images: p.images,
    tags: p.tags,
    shortDescription: p.short,
    description: p.desc,
    attributes: (p.attrs || []).map(([key, value]) => ({ key, value })),
    variants: (p.variants || []).map((v, i) => ({ ...v, sku: `${slugify(p.brand).slice(0, 4).toUpperCase()}-${i + 1}` })),
    stock: p.stock ?? 0,
    sku: `${slugify(p.brand).slice(0, 4).toUpperCase()}-${Math.floor(10000 + Math.random() * 89999)}`,
    seller: users[p.s]._id,
    store: stores[p.s]._id,
    category: categories[p.c]._id,
    isFeatured: Boolean(p.featured),
    moderationStatus,
    lowStockThreshold: 5,
  });
  const products = [];
  for (const p of data.products) products.push(await Product.create(build(p, 'APPROVED')));
  for (const p of data.pendingProducts) products.push(await Product.create(build(p, 'PENDING')));
  await Inventory.insertMany(
    products.map((p) => ({ product: p._id, seller: p.seller, type: 'INITIAL', quantity: p.stock, stockAfter: p.stock, reason: 'Opening stock' })),
  );
  console.log(`✓ ${products.length} products (${data.pendingProducts.length} pending moderation)`);

  // Coupons
  for (const c of data.coupons) {
    const { days, ...rest } = c;
    await Coupon.create({ ...rest, expiresAt: new Date(Date.now() + days * 86400000) });
  }
  console.log(`✓ ${data.coupons.length} coupons`);

  // Welcome notifications
  await Notification.insertMany([
    { user: users.customer._id, type: 'PROMO', title: 'Welcome to ShopSphere!', message: 'Use code WELCOME10 for 10% off your next order.', link: '/products' },
    { user: users.admin._id, type: 'SELLER_APPLICATION', title: 'New seller application', message: 'Kabir Handicrafts applied to sell on ShopSphere.', link: '/admin/seller-applications' },
  ]);

  await seedActivity({ users, stores, products, categories });

  console.log('\nSeed complete. Demo password for all accounts:', data.DEMO_PASSWORD);
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
