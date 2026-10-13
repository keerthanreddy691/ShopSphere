import { useNavigate } from 'react-router-dom';
import { LogOut, Package, User, Heart, LayoutDashboard, LifeBuoy, ChevronDown } from 'lucide-react';
import { Dropdown, DropdownItem } from '@/components/ui/dropdown';
import { Avatar } from '@/components/ui/avatar';
import { useAuth, useLogout, ROLE_HOME } from '@/hooks/useAuth';
import { titleCase } from '@/lib/format';

export function UserMenu() {
  const { user } = useAuth();
  const logout = useLogout();
  const navigate = useNavigate();
  if (!user) return null;
  const go = (to, close) => () => {
    close();
    navigate(to);
  };
  return (
    <Dropdown
      trigger={({ toggle }) => (
        <button onClick={toggle} className="flex items-center gap-2 rounded-xl p-1 pr-2 transition hover:bg-slate-100" aria-label="Account menu">
          <Avatar name={user.name} src={user.avatar} className="size-8" />
          <span className="hidden text-left leading-tight xl:block">
            <span className="block max-w-[110px] truncate text-sm font-semibold">{user.name.split(' ')[0]}</span>
            <span className="block text-[11px] text-ink-muted">{titleCase(user.role)}</span>
          </span>
          <ChevronDown className="hidden size-4 text-slate-400 xl:block" />
        </button>
      )}
    >
      {({ close }) => (
        <>
          <div className="border-b border-slate-100 px-2.5 pb-2.5 pt-1.5">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-ink-muted">{user.email}</p>
          </div>
          <div className="pt-1">
            {user.role === 'CUSTOMER' ? (
              <>
                <DropdownItem icon={Package} onClick={go('/account/orders', close)}>My orders</DropdownItem>
                <DropdownItem icon={Heart} onClick={go('/wishlist', close)}>Wishlist</DropdownItem>
                <DropdownItem icon={LifeBuoy} onClick={go('/account/support', close)}>Help & support</DropdownItem>
                <DropdownItem icon={User} onClick={go('/account/profile', close)}>Profile</DropdownItem>
              </>
            ) : (
              <DropdownItem icon={LayoutDashboard} onClick={go(ROLE_HOME[user.role], close)}>Dashboard</DropdownItem>
            )}
            <DropdownItem
              icon={LogOut}
              danger
              onClick={() => {
                close();
                logout.mutate(undefined, { onSettled: () => navigate('/') });
              }}
            >
              Log out
            </DropdownItem>
          </div>
        </>
      )}
    </Dropdown>
  );
}
