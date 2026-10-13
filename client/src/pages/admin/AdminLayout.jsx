import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  ShieldCheck,
  Users,
  Grid,
  ShoppingBag,
  RotateCcw,
  MessageSquareText,
  Tag,
  LifeBuoy,
  BadgePercent,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const ADMIN_NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/seller-applications', label: 'Seller Approvals', icon: Store },
  { to: '/admin/products', label: 'Product Moderation', icon: ShieldCheck },
  { to: '/admin/users', label: 'Users & Staff', icon: Users },
  { to: '/admin/categories', label: 'Categories', icon: Grid },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/returns', label: 'Returns', icon: RotateCcw },
  { to: '/admin/reviews', label: 'Reviews', icon: MessageSquareText },
  { to: '/admin/coupons', label: 'Coupons', icon: Tag },
  { to: '/admin/support', label: 'Support & Disputes', icon: LifeBuoy },
  { to: '/admin/settlements', label: 'Settlements', icon: BadgePercent },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
];

export default function AdminLayout() {
  const { user } = useAuth();

  return (
    <div className="container py-6 sm:py-8">
      <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-36 lg:self-start">
          <div className="card mb-3 p-4">
            <div className="flex items-center gap-3">
              <Avatar name={user?.name || 'Admin'} className="size-10 bg-slate-900 text-white" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{user?.name}</p>
                <p className="text-xs text-brand-600 font-semibold uppercase tracking-wider">Super Administrator</p>
              </div>
            </div>
          </div>

          <nav className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 lg:card lg:mx-0 lg:flex-col lg:p-2">
            {ADMIN_NAV.map((item) => {
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
                        ? 'bg-slate-900 text-white font-semibold shadow-sm'
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

        {/* Main Content */}
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

