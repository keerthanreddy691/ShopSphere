import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Menu, LayoutGrid, Store, LayoutDashboard, LogIn, Package, User, LifeBuoy, LogOut } from 'lucide-react';
import { Logo } from './Logo';
import { SearchBar } from './SearchBar';
import { NotificationBell } from './NotificationBell';
import { UserMenu } from './UserMenu';
import { CategoryIcon } from './CategoryIcon';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/dialog';
import { Dropdown } from '@/components/ui/dropdown';
import { useAuth, useLogout, ROLE_HOME } from '@/hooks/useAuth';
import { useCartCount, useWishlistIds } from '@/hooks/useShopping';
import { useCategories } from '@/hooks/useCatalog';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

function CountBadge({ n }) {
  if (!n) return null;
  return <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">{n > 99 ? '99+' : n}</span>;
}

function CategoriesMenu() {
  const { data: categories = [] } = useCategories();
  return (
    <Dropdown
      align="left"
      width="w-[34rem]"
      trigger={({ toggle, open }) => (
        <Button variant="ghost" onClick={toggle} className={cn('hidden lg:inline-flex', open && 'bg-slate-100')}>
          <LayoutGrid /> Categories
        </Button>
      )}
    >
      {({ close }) => (
        <div className="grid grid-cols-2 gap-1 p-1">
          {categories.map((c) => (
            <Link key={c._id} to={`/category/${c.slug}`} onClick={close} className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-slate-50">
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <CategoryIcon name={c.icon} className="size-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold">{c.name}</span>
                <span className="block text-xs text-ink-muted">{c.productCount} products</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </Dropdown>
  );
}

function MobileMenu() {
  const open = useUIStore((s) => s.mobileNavOpen);
  const setOpen = useUIStore((s) => s.setMobileNav);
  const { user } = useAuth();
  const logout = useLogout();
  const navigate = useNavigate();
  const { data: categories = [] } = useCategories();
  const close = () => setOpen(false);
  const link = 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-slate-50';
  return (
    <Sheet open={open} onClose={close} title={<Logo />}>
      <div className="space-y-6 p-3">
        {user ? (
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-sm font-semibold">Hi, {user.name.split(' ')[0]}</p>
            <p className="text-xs text-ink-muted">{user.email}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Link to="/login" onClick={close}><Button variant="outline" className="w-full">Log in</Button></Link>
            <Link to="/register" onClick={close}><Button className="w-full">Sign up</Button></Link>
          </div>
        )}
        <div>
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">Shop by category</p>
          {categories.map((c) => (
            <Link key={c._id} to={`/category/${c.slug}`} onClick={close} className={link}>
              <CategoryIcon name={c.icon} className="size-4 text-brand-600" /> {c.name}
            </Link>
          ))}
        </div>
        <div>
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">Account</p>
          {user?.role === 'CUSTOMER' && (
            <>
              <Link to="/account/orders" onClick={close} className={link}><Package className="size-4" /> My orders</Link>
              <Link to="/wishlist" onClick={close} className={link}><Heart className="size-4" /> Wishlist</Link>
              <Link to="/account/support" onClick={close} className={link}><LifeBuoy className="size-4" /> Help & support</Link>
              <Link to="/account/profile" onClick={close} className={link}><User className="size-4" /> Profile</Link>
            </>
          )}
          {user && user.role !== 'CUSTOMER' && (
            <Link to={ROLE_HOME[user.role]} onClick={close} className={link}><LayoutDashboard className="size-4" /> Dashboard</Link>
          )}
          <Link to="/stores" onClick={close} className={link}><Store className="size-4" /> All stores</Link>
          {!user && <Link to="/register?role=seller" onClick={close} className={link}><Store className="size-4" /> Sell on ShopSphere</Link>}
          {user && (
            <button onClick={() => { close(); logout.mutate(undefined, { onSettled: () => navigate('/') }); }} className={cn(link, 'w-full text-red-600')}>
              <LogOut className="size-4" /> Log out
            </button>
          )}
        </div>
      </div>
    </Sheet>
  );
}

export function Navbar() {
  const { user, isLoading } = useAuth();
  const cartCount = useCartCount();
  const wishlistCount = useWishlistIds().size;
  const setMobileNav = useUIStore((s) => s.setMobileNav);
  const { data: categories = [] } = useCategories();
  const isCustomer = user?.role === 'CUSTOMER';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="hidden bg-slate-900 text-xs text-slate-300 sm:block">
        <div className="container flex h-8 items-center justify-between">
          <p>Free delivery on orders above ₹499 · Easy 7-day returns · 100% secure payments</p>
          <div className="flex items-center gap-4">
            <Link to="/help" className="hover:text-white">Help centre</Link>
            {!user && <Link to="/register?role=seller" className="font-medium text-white hover:underline">Sell on ShopSphere</Link>}
          </div>
        </div>
      </div>

      <div className="container flex h-16 items-center gap-2 sm:gap-4">
        <Button variant="ghost" size="icon" className="-ml-2 lg:hidden" onClick={() => setMobileNav(true)} aria-label="Open menu">
          <Menu />
        </Button>
        <Logo />
        <CategoriesMenu />
        <SearchBar className="mx-2 hidden max-w-2xl flex-1 md:block" />
        <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
          {!isLoading && !user && (
            <>
              <Link to="/login" className="hidden sm:block"><Button variant="ghost">Log in</Button></Link>
              <Link to="/login" className="sm:hidden"><Button variant="ghost" size="icon" aria-label="Log in"><LogIn /></Button></Link>
              <Link to="/register" className="hidden sm:block"><Button>Sign up</Button></Link>
            </>
          )}
          {user && !isCustomer && (
            <Link to={ROLE_HOME[user.role]} className="hidden sm:block">
              <Button variant="soft" size="sm"><LayoutDashboard /> Dashboard</Button>
            </Link>
          )}
          {(isCustomer || !user) && (
            <>
              <Link to="/wishlist" className="hidden sm:block">
                <Button variant="ghost" size="icon" className="relative" aria-label="Wishlist">
                  <Heart />
                  <CountBadge n={wishlistCount} />
                </Button>
              </Link>
              <Link to="/cart">
                <Button variant="ghost" size="icon" className="relative" aria-label="Cart">
                  <ShoppingCart />
                  <CountBadge n={cartCount} />
                </Button>
              </Link>
            </>
          )}
          {user && <NotificationBell />}
          {user && <UserMenu />}
        </div>
      </div>

      <div className="container pb-3 md:hidden">
        <SearchBar />
      </div>

      <nav className="hidden border-t border-slate-100 lg:block">
        <div className="container scrollbar-none flex h-11 items-center gap-1 overflow-x-auto">
          {categories.map((c) => (
            <NavLink
              key={c._id}
              to={`/category/${c.slug}`}
              className={({ isActive }) => cn('shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition', isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-soft hover:bg-slate-100 hover:text-ink')}
            >
              {c.name}
            </NavLink>
          ))}
          <span className="mx-2 h-5 w-px bg-slate-200" />
          <NavLink to="/deals" className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-accent-600 hover:bg-orange-50">Today's Deals</NavLink>
          <NavLink to="/stores" className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-slate-100">Stores</NavLink>
        </div>
      </nav>
      <MobileMenu />
    </header>
  );
}
