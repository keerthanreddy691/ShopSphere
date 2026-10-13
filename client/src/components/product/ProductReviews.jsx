import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BadgeCheck, MessageSquareText } from 'lucide-react';
import { get } from '@/lib/api';
import { Stars } from '@/components/common/Rating';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/format';

export function ProductReviews({ productId }) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['reviews', productId, page],
    queryFn: () => get(`/reviews/product/${productId}`, { page, limit: 5 }),
  });
  if (isLoading) return <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-24" />)}</div>;
  const summary = data?.summary;
  if (!data?.items?.length) {
    return <EmptyState icon={MessageSquareText} title="No reviews yet" description="Only verified buyers can review this product. Bought it? Share your experience from your order page." />;
  }
  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <div>
        <p className="text-5xl font-bold">{summary.average.toFixed(1)}</p>
        <Stars value={summary.average} size="md" className="mt-2" />
        <p className="mt-1 text-sm text-ink-muted">{summary.count} verified ratings</p>
        <div className="mt-5 space-y-1.5">
          {[5, 4, 3, 2, 1].map((r) => {
            const n = summary.distribution[r] || 0;
            const pct = summary.count ? (n / summary.count) * 100 : 0;
            return (
              <div key={r} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-ink-muted">{r}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-6 text-right text-ink-muted">{n}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div>
        <ul className="divide-y divide-slate-100">
          {data.items.map((r) => (
            <li key={r._id} className="py-5 first:pt-0">
              <div className="flex items-center gap-3">
                <Avatar name={r.customer?.name} className="size-8" />
                <div>
                  <p className="text-sm font-semibold">{r.customer?.name || 'ShopSphere customer'}</p>
                  <div className="flex items-center gap-2">
                    <Stars value={r.rating} />
                    <span className="text-xs text-ink-muted">{formatDate(r.createdAt)}</span>
                  </div>
                </div>
                {r.verifiedPurchase && (
                  <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <BadgeCheck className="size-4" /> Verified purchase
                  </span>
                )}
              </div>
              {r.title && <p className="mt-3 font-semibold">{r.title}</p>}
              {r.comment && <p className="mt-1 text-sm leading-relaxed text-ink-soft">{r.comment}</p>}
              {r.images?.length > 0 && (
                <div className="mt-3 flex gap-2">
                  {r.images.map((src) => <img key={src} src={src} alt="" className="size-16 rounded-lg object-cover" />)}
                </div>
              )}
            </li>
          ))}
        </ul>
        <Pagination page={page} pages={data.pagination.pages} onChange={setPage} className="mt-4" />
      </div>
    </div>
  );
}
