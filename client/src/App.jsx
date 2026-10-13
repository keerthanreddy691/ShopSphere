import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { RequireAuth, GuestOnly } from '@/components/layout/RouteGuards';
import { PageLoader } from '@/components/ui/spinner';
import HomePage from '@/pages/public/HomePage';
import ProductsPage from '@/pages/public/ProductsPage';
import ProductDetailPage from '@/pages/public/ProductDetailPage';
import StorePage from '@/pages/public/StorePage';
import StoresPage from '@/pages/public/StoresPage';
import NotFoundPage from '@/pages/public/NotFoundPage';
import { AboutPage, ContactPage, HelpPage, PrivacyPage, TermsPage } from '@/pages/public/InfoPages';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';

const SmartSearchPage = lazy(() => import('@/pages/public/SmartSearchPage'));

const CartPage = lazy(() => import('@/pages/customer/CartPage'));
const CheckoutPage = lazy(() => import('@/pages/customer/CheckoutPage'));
const OrderSuccessPage = lazy(() => import('@/pages/customer/OrderSuccessPage'));
const AccountLayout = lazy(() => import('@/pages/customer/AccountLayout'));
const MyOrdersPage = lazy(() => import('@/pages/customer/MyOrdersPage'));
const OrderDetailPage = lazy(() => import('@/pages/customer/OrderDetailPage'));
const WishlistPage = lazy(() => import('@/pages/customer/WishlistPage'));
const NotificationsPage = lazy(() => import('@/pages/customer/NotificationsPage'));
const CustomerSupportPage = lazy(() => import('@/pages/customer/CustomerSupportPage'));
const ProfilePage = lazy(() => import('@/pages/customer/ProfilePage'));

const SellerLayout = lazy(() => import('@/pages/seller/SellerLayout'));
const SellerOverviewPage = lazy(() => import('@/pages/seller/SellerOverviewPage'));
const SellerProductsPage = lazy(() => import('@/pages/seller/SellerProductsPage'));
const SellerProductFormPage = lazy(() => import('@/pages/seller/SellerProductFormPage'));
const SellerInventoryPage = lazy(() => import('@/pages/seller/SellerInventoryPage'));
const SellerOrdersPage = lazy(() => import('@/pages/seller/SellerOrdersPage'));
const SellerReturnsPage = lazy(() => import('@/pages/seller/SellerReturnsPage'));
const SellerSettlementsPage = lazy(() => import('@/pages/seller/SellerSettlementsPage'));
const SellerStorePage = lazy(() => import('@/pages/seller/SellerStorePage'));

const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'));
const AdminOverviewPage = lazy(() => import('@/pages/admin/AdminOverviewPage'));
const AdminSellerApplicationsPage = lazy(() => import('@/pages/admin/AdminSellerApplicationsPage'));
const AdminProductModerationPage = lazy(() => import('@/pages/admin/AdminProductModerationPage'));
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'));
const AdminCategoriesPage = lazy(() => import('@/pages/admin/AdminCategoriesPage'));
const AdminCouponsPage = lazy(() => import('@/pages/admin/AdminCouponsPage'));

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<GuestOnly />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/search/smart" element={<SmartSearchPage />} />
          <Route path="/category/:slug" element={<ProductsPage />} />
          <Route path="/deals" element={<ProductsPage mode="deals" />} />
          <Route path="/product/:slug" element={<ProductDetailPage />} />
          <Route path="/store/:slug" element={<StorePage />} />
          <Route path="/stores" element={<StoresPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />

          <Route element={<RequireAuth roles={['CUSTOMER']} />}>
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-success/:checkoutId" element={<OrderSuccessPage />} />
            <Route element={<AccountLayout />}>
              <Route path="/account/orders" element={<MyOrdersPage />} />
              <Route path="/account/orders/:orderId" element={<OrderDetailPage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/account/notifications" element={<NotificationsPage />} />
              <Route path="/account/support" element={<CustomerSupportPage />} />
            </Route>
            {/* Order notifications link to the whole checkout */}
            <Route path="/account/orders/checkout/:checkoutId" element={<OrderSuccessPage />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route element={<AccountLayout />}>
              <Route path="/account/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          <Route element={<RequireAuth roles={['SELLER']} />}>
            <Route path="/seller" element={<SellerLayout />}>
              <Route index element={<SellerOverviewPage />} />
              <Route path="products" element={<SellerProductsPage />} />
              <Route path="products/new" element={<SellerProductFormPage />} />
              <Route path="products/:id/edit" element={<SellerProductFormPage />} />
              <Route path="inventory" element={<SellerInventoryPage />} />
              <Route path="orders" element={<SellerOrdersPage />} />
              <Route path="orders/:orderId" element={<SellerOrdersPage />} />
              <Route path="returns" element={<SellerReturnsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settlements" element={<SellerSettlementsPage />} />
              <Route path="store" element={<SellerStorePage />} />
            </Route>
          </Route>

          <Route element={<RequireAuth roles={['ADMIN']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminOverviewPage />} />
              <Route path="seller-applications" element={<AdminSellerApplicationsPage />} />
              <Route path="products" element={<AdminProductModerationPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="categories" element={<AdminCategoriesPage />} />
              <Route path="coupons" element={<AdminCouponsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
