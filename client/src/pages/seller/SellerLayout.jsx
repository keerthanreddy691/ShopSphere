import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  Boxes,
  ShoppingBag,
  RotateCcw,
  BadgePercent,
  Store,
  ExternalLink,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import { Avatar } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/seller', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/seller/products', label: 'Products', icon: Package },
  { to: '/seller/products/new', label: 'Add Product', icon: PlusCircle },
  { to: '/seller/inventory', label: 'Inventory', icon: Boxes },
  { to: '/seller/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/seller/returns', label: 'Returns', icon: RotateCcw },
  { to: '/seller/settlements', label: 'Settlements', icon: BadgePercent },
  { to: '/seller/store', label: 'Store Settings', icon: Store },
];

export default function SellerLayout() {
  const { user } = useAuth();
  const location = useLocation();

  // Fetch seller profile to know approval status and store details
  const { data: sellerData } = useQuery({
    queryKey: ['seller-profile'],
    queryFn: () => get('/sellers/me').then((d) => d.seller),
    staleTime: 60_000,
  });

  const seller = sellerData || user?.seller || {};
  const isApproved = seller.status === 'APPROVED';
  const isPending = seller.status === 'PENDING';
  const isRejected = seller.status === 'REJECTED';

  return (
    <div className="container py-6 sm:py-8">
      {/* Top Banner if Seller is not yet approved */}
      {!isApproved && (
        <Card className="mb-6 border-amber-300 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            {isPending && <Clock className="mt-0.5 size-5 shrink-0 text-amber-600" />}
            {isRejected && <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-600" />}
            <div>
              <h2 className="text-base font-bold text-ink">
                {isPending && 'Seller Application Under Review'}
                {isRejected && 'Seller Application Requires Attention'}
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                {isPending &&
                  `Your store "${seller.businessName || 'Your Store'}" application is being verified by the ShopSphere administration team. You can explore settings below while approval is processed.`}
                {isRejected &&
                  `Your application was not approved. Reason: "${seller.rejectionReason || 'Details incomplete'}". You can update your profile to resubmit for approval.`}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-36 lg:self-start">
          <div className="card mb-3 p-4">
            <div className="flex items-center gap-3">
              <Avatar name={seller.store?.name || seller.businessName || user?.name} className="size-10 bg-brand-600 text-white" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{seller.store?.name || seller.businessName || 'My Store'}</p>
                <div className="mt-0.5">
                  <StatusBadge status={seller.status || 'PENDING'} />
                </div>
              </div>
            </div>

            {seller.store?.slug && (
              <div className="mt-3 border-t border-slate-100 pt-3">
                <Link
                  to={`/store/${seller.store.slug}`}
                  target="_blank"
                  className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:underline"
                >
                  <ExternalLink className="size-3.5" /> View Public Storefront
                </Link>
              </div>
            )}
          </div>

          <nav className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 lg:card lg:mx-0 lg:flex-col lg:p-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition',
                      isActive
                        ? 'bg-brand-50 text-brand-700 font-semibold'
                        : 'bg-white text-ink-soft ring-1 ring-slate-200 hover:bg-slate-50 lg:bg-transparent lg:ring-0',
                    )
                  }
                >
                  <Icon className="size-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

