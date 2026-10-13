import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { useNotifications, useMarkNotifications } from '@/hooks/useShopping';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { timeAgo, formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
  const [filter, setFilter] = useState('all');
  const { data, isLoading, isError, error, refetch } = useNotifications({ limit: 50 });
  const { markOne, markAll } = useMarkNotifications();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  const allItems = data?.items || [];
  const items = filter === 'unread' ? allItems.filter((n) => !n.isRead) : allItems;
  const unreadCount = data?.unread || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="mt-1 text-sm text-ink-muted">Stay informed on your orders, deliveries and promotions.</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAll.mutate()}>
            <CheckCheck className="size-4" /> Mark all as read
          </Button>
        )}
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
            filter === 'all' ? 'bg-slate-900 text-white' : 'text-ink-muted hover:bg-slate-100 hover:text-ink',
          )}
        >
          All ({allItems.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={cn(
            'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
            filter === 'unread' ? 'bg-slate-900 text-white' : 'text-ink-muted hover:bg-slate-100 hover:text-ink',
          )}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {!items.length ? (
        <Card>
          <EmptyState
            icon={Inbox}
            title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            description="When you place orders, receive status updates or deals, they will appear here."
          />
        </Card>
      ) : (
        <Card className="divide-y divide-slate-100 overflow-hidden">
          {items.map((n) => (
            <div
              key={n._id}
              className={cn(
                'flex items-start gap-4 p-4 transition hover:bg-slate-50/70 sm:p-5',
                !n.isRead && 'bg-brand-50/30',
              )}
            >
              <span
                className={cn(
                  'mt-1.5 size-2.5 shrink-0 rounded-full',
                  n.isRead ? 'bg-slate-200' : 'bg-brand-600 ring-4 ring-brand-100',
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-sm font-semibold text-ink">{n.title}</h3>
                  <span className="text-xs text-ink-muted">{timeAgo(n.createdAt)}</span>
                </div>
                {n.message && <p className="mt-1 text-sm text-ink-soft">{n.message}</p>}
                <div className="mt-3 flex items-center gap-3">
                  {n.link && (
                    <Link
                      to={n.link}
                      onClick={() => !n.isRead && markOne.mutate(n._id)}
                      className="text-xs font-semibold text-brand-600 hover:underline"
                    >
                      View details →
                    </Link>
                  )}
                  {!n.isRead && (
                    <button
                      onClick={() => markOne.mutate(n._id)}
                      className="text-xs font-medium text-ink-muted hover:text-ink hover:underline"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

