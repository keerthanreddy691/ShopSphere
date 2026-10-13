import * as categoryService from '../services/categoryService.js';
import * as productService from '../services/productService.js';
import * as storeService from '../services/storeService.js';
import * as sellerService from '../services/sellerService.js';
import * as inventoryService from '../services/inventoryService.js';
import { audit } from '../services/auditService.js';
import { notify } from '../services/notificationService.js';
import { ok, created } from '../utils/response.js';
import { getPagination } from '../utils/pagination.js';

// ----- Categories -----
export const listCategories = async (req, res) =>
  ok(res, { categories: await categoryService.list({ includeInactive: req.query.all === 'true' && req.user?.role === 'ADMIN' }) });
export const getCategory = async (req, res) => ok(res, { category: await categoryService.getBySlug(req.params.slug) });
export async function createCategory(req, res) {
  const category = await categoryService.create(req.body);
  await audit(req, 'CATEGORY_CREATED', 'Category', category._id, { name: category.name });
  return created(res, { category }, 'Category created');
}
export async function updateCategory(req, res) {
  const category = await categoryService.update(req.params.id, req.body);
  await audit(req, 'CATEGORY_UPDATED', 'Category', category._id, { name: category.name });
  return ok(res, { category }, 'Category updated');
}
export async function toggleCategory(req, res) {
  const category = await categoryService.update(req.params.id, { isActive: Boolean(req.body.isActive) });
  await audit(req, category.isActive ? 'CATEGORY_ACTIVATED' : 'CATEGORY_DEACTIVATED', 'Category', category._id, { name: category.name });
  return ok(res, { category }, category.isActive ? 'Category activated' : 'Category deactivated');
}
export async function deleteCategory(req, res) {
  const category = await categoryService.remove(req.params.id);
  await audit(req, 'CATEGORY_DELETED', 'Category', category._id, { name: category.name });
  return ok(res, {}, 'Category deleted');
}

// ----- Products (public) -----
export const listProducts = async (req, res) => ok(res, await productService.listPublic(req.query, getPagination(req.query, 12, 60)));
export const listBrands = async (_req, res) => ok(res, { brands: await productService.brands() });
export const getProduct = async (req, res) => ok(res, { product: await productService.getPublic(req.params.slug, req.user) });

// ----- Products (seller) -----
export const listMyProducts = async (req, res) => ok(res, await productService.listForSeller(req.user._id, req.query, getPagination(req.query, 20)));
export const getMyProduct = async (req, res) => ok(res, { product: await productService.getOwn(req.user, req.params.id) });
export async function createProduct(req, res) {
  const product = await productService.create(req.user, req.body);
  return created(res, { product }, 'Product submitted for approval');
}
export async function updateProduct(req, res) {
  const product = await productService.update(req.user, req.params.id, req.body);
  return ok(res, { product }, 'Product updated');
}
export async function deleteProduct(req, res) {
  const { archived } = await productService.remove(req.user, req.params.id);
  return ok(res, { archived }, archived ? 'Product has past orders, so it was archived instead of deleted' : 'Product deleted');
}

// ----- Products (admin) -----
export const adminListProducts = async (req, res) => ok(res, await productService.listForAdmin(req.query, getPagination(req.query, 20)));
export async function moderateProduct(req, res) {
  const product = await productService.moderate(req.params.id, req.body);
  await audit(req, req.body.status === 'APPROVED' ? 'PRODUCT_APPROVED' : 'PRODUCT_REJECTED', 'Product', product._id, { name: product.name, note: req.body.note });
  await notify(product.seller, {
    type: 'PRODUCT_MODERATION',
    title: req.body.status === 'APPROVED' ? 'Product approved' : 'Product rejected',
    message: req.body.status === 'APPROVED' ? `"${product.name}" is now live on ShopSphere.` : `"${product.name}" was rejected. ${req.body.note}`,
    link: `/seller/products/${product._id}/edit`,
  });
  return ok(res, { product }, `Product ${req.body.status.toLowerCase()}`);
}
export async function featureProduct(req, res) {
  const product = await productService.toggleFeatured(req.params.id);
  await audit(req, product.isFeatured ? 'PRODUCT_FEATURED' : 'PRODUCT_UNFEATURED', 'Product', product._id, { name: product.name });
  return ok(res, { product }, product.isFeatured ? 'Product featured' : 'Product unfeatured');
}

// ----- Stores -----
export const listStores = async (req, res) => ok(res, { stores: await storeService.listPublic(req.query) });
export const getStore = async (req, res) => ok(res, { store: await storeService.getBySlug(req.params.slug) });
export const getMyStore = async (req, res) => ok(res, { store: await storeService.getMine(req.user._id) });
export async function saveMyStore(req, res) {
  const { store, created: isNew } = await storeService.upsertMine(req.user._id, req.body);
  return isNew ? created(res, { store }, 'Store created') : ok(res, { store }, 'Store updated');
}

// ----- Sellers -----
export const getMyOverview = async (req, res) => ok(res, await sellerService.getOverview(req.user._id));
export const getMySellerProfile = async (req, res) => ok(res, { seller: await sellerService.getMine(req.user._id) });
export const updateMySellerProfile = async (req, res) => ok(res, { seller: await sellerService.updateMine(req.user._id, req.body) }, 'Seller profile updated');
export const listSellers = async (req, res) => ok(res, await sellerService.list(req.query, getPagination(req.query, 20)));
export async function reviewSeller(req, res) {
  const seller = await sellerService.review(req.user._id, req.params.id, req.body);
  await audit(req, `SELLER_${req.body.status}`, 'Seller', seller._id, { businessName: seller.businessName, reason: req.body.reason });
  return ok(res, { seller }, `Seller ${req.body.status.toLowerCase()}`);
}

// ----- Inventory -----
export const listInventory = async (req, res) => ok(res, { items: await inventoryService.listForSeller(req.user._id, req.query) });
export async function updateInventory(req, res) {
  const product = await inventoryService.updateStock(req.user, req.params.productId, req.body);
  return ok(res, { product }, 'Stock updated');
}
export const inventoryHistory = async (req, res) => ok(res, { history: await inventoryService.history(req.user, req.params.productId) });
