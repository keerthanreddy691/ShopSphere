import { NavLink, Outlet } from 'react-router-dom';
import { Package, Heart, User, Bell, LifeBuoy } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const LINKS = [
  ['/account/orders', 'My orders', Package],
  ['/wishlist', 'Wishlist', Heart],
  ['/account/notifications', 'Notifications', Bell],
  ['/account/support', 'Help & support', LifeBuoy],
  ['/account/profile', 'Profile', User],
];

export default function AccountLayout() {
  const { user } = useAuth();
  return (
    <div className="container py-6 sm:py-8">
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-36 lg:self-start">
          <div className="card hidden items-center gap-3 p-4 lg:flex">
            <Avatar name={user?.name} src={user?.avatar} className="size-11" />
            <div className="min-w-0">
              <p className="text-xs text-ink-muted">Hello,</p>
              <p className="truncate font-semibold">{user?.name}</p>
            </div>
          </div>
          <nav className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 lg:card lg:mx-0 lg:mt-3 lg:flex-col lg:p-2">
            {LINKS.map(([to, label, Icon]) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => cn('flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition', isActive ? 'bg-brand-50 text-brand-700' : 'bg-white text-ink-soft ring-1 ring-slate-200 hover:bg-slate-50 lg:bg-transparent lg:ring-0')}
              >
                <Icon className="size-4" /> {label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
