import { Link } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { Dropdown } from '@/components/ui/dropdown';
import { Button } from '@/components/ui/button';
import { useNotifications, useMarkNotifications } from '@/hooks/useShopping';
import { useAuth } from '@/hooks/useAuth';
import { timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';

const listPath = { CUSTOMER: '/account/notifications', SELLER: '/seller/notifications', ADMIN: '/admin/notifications', SUPPORT: '/support/notifications', DELIVERY: '/delivery/notifications' };

export function NotificationBell() {
  const { role } = useAuth();
  const { data } = useNotifications({ limit: 6 });
  const { markOne, markAll } = useMarkNotifications();
  const unread = data?.unread || 0;
  return (
    <Dropdown
      width="w-[22rem] max-w-[calc(100vw-2rem)]"
      trigger={({ toggle }) => (
        <Button variant="ghost" size="icon" onClick={toggle} className="relative" aria-label={`Notifications (${unread} unread)`}>
          <Bell />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      )}
    >
      {({ close }) => (
        <div>
          <div className="flex items-center justify-between px-2.5 py-2">
            <p className="text-sm font-semibold">Notifications</p>
            {unread > 0 && (
              <button onClick={() => markAll.mutate()} className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
                <CheckCheck className="size-3.5" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {!data?.items?.length ? (
              <p className="px-3 py-8 text-center text-sm text-ink-muted">You're all caught up 🎉</p>
            ) : (
              data.items.map((n) => (
                <Link
                  key={n._id}
                  to={n.link || listPath[role]}
                  onClick={() => {
                    if (!n.isRead) markOne.mutate(n._id);
                    close();
                  }}
                  className={cn('flex gap-3 rounded-lg px-2.5 py-2.5 hover:bg-slate-50', !n.isRead && 'bg-brand-50/50')}
                >
                  <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', n.isRead ? 'bg-transparent' : 'bg-brand-500')} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-snug">{n.title}</p>
                    {n.message && <p className="mt-0.5 line-clamp-2 text-xs text-ink-muted">{n.message}</p>}
                    <p className="mt-1 text-[11px] text-slate-400">{timeAgo(n.createdAt)}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
          <Link to={listPath[role]} onClick={close} className="mt-1 block rounded-lg border-t border-slate-100 px-2.5 py-2 text-center text-sm font-medium text-brand-600 hover:bg-slate-50">
            View all notifications
          </Link>
        </div>
      )}
    </Dropdown>
  );
}
