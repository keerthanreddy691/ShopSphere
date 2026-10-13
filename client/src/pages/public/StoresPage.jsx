import { Link } from 'react-router-dom';
import { Star, Store as StoreIcon } from 'lucide-react';
import { useStores } from '@/hooks/useCatalog';
import { SafeImage } from '@/components/common/SafeImage';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber } from '@/lib/format';

export default function StoresPage() {
  const { data: stores, isLoading } = useStores({ limit: 50 });
  return (
    <div className="container py-8">
      <PageHeader title="Stores on ShopSphere" description="Every seller is verified by our team before going live." />
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}</div>
      ) : !stores.length ? (
        <div className="card"><EmptyState icon={StoreIcon} title="No stores yet" /></div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((s) => (
            <Link key={s._id} to={`/store/${s.slug}`} className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card transition hover:shadow-lift">
              <SafeImage src={s.banner} alt="" className="h-32 w-full object-cover transition duration-500 group-hover:scale-105" />
              <div className="p-5">
                <div className="flex items-center gap-3">
                  <SafeImage src={s.logo} alt="" className="-mt-12 size-16 rounded-xl border-4 border-white object-cover shadow" />
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold">{s.name}</p>
                    <p className="text-xs text-ink-muted">{s.city}</p>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-ink-muted">{s.description}</p>
                <div className="mt-4 flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 font-semibold"><Star className="size-4 fill-amber-400 text-amber-400" /> {s.rating ? s.rating.toFixed(1) : 'New'}</span>
                  <span className="text-ink-muted">{formatNumber(s.productCount)} products</span>
                  <span className="text-ink-muted">{formatNumber(s.totalSold)} sold</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
