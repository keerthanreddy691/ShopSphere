import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Star, MapPin, Mail, Phone, Package, ShoppingBag, CalendarDays, Store } from 'lucide-react';
import { useStore, useProducts } from '@/hooks/useCatalog';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Pagination } from '@/components/common/Pagination';
import { SafeImage } from '@/components/common/SafeImage';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Select } from '@/components/ui/input';
import { formatDate, formatNumber } from '@/lib/format';

export default function StorePage() {
  const { slug } = useParams();
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('popular');
  const { data: store, isLoading, isError, error } = useStore(slug);
  const products = useProducts({ store: slug, page, sort, limit: 12 });

  if (isError) return <div className="container py-10"><ErrorState error={error} /></div>;
  return (
    <div className="pb-8">
      <div className="container pt-4 sm:pt-6">
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-card">
          {isLoading ? <Skeleton className="h-40 rounded-none sm:h-56" /> : <SafeImage src={store.banner} alt="" className="h-40 w-full object-cover sm:h-56" />}
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-end sm:p-7">
            {isLoading ? <Skeleton className="-mt-16 size-24 rounded-2xl" /> : <SafeImage src={store.logo} alt={store.name} className="-mt-16 size-24 rounded-2xl border-4 border-white object-cover shadow-lg sm:-mt-20 sm:size-28" />}
            <div className="flex-1">
              {isLoading ? <Skeleton className="h-8 w-64" /> : (
                <>
                  <h1 className="text-2xl font-bold sm:text-3xl">{store.name}</h1>
                  <p className="mt-1 max-w-2xl text-sm text-ink-muted">{store.description}</p>
                </>
              )}
            </div>
          </div>
          {store && (
            <div className="grid grid-cols-2 gap-px border-t border-slate-100 bg-slate-100 sm:grid-cols-4">
              {[
                [Star, store.rating ? `${store.rating.toFixed(1)} / 5` : 'New', `${store.ratingCount} ratings`],
                [Package, formatNumber(store.productCount), 'Products'],
                [ShoppingBag, formatNumber(store.totalSold), 'Items sold'],
                [CalendarDays, formatDate(store.createdAt, { month: 'short', year: 'numeric' }), 'Selling since'],
              ].map(([Icon, v, l]) => (
                <div key={l} className="flex items-center gap-3 bg-white p-4">
                  <Icon className="size-5 text-brand-600" />
                  <div>
                    <p className="font-semibold">{v}</p>
                    <p className="text-xs text-ink-muted">{l}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {store && (
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted">
            {store.city && <span className="flex items-center gap-1.5"><MapPin className="size-4" /> {store.city}</span>}
            {store.contactEmail && <span className="flex items-center gap-1.5"><Mail className="size-4" /> {store.contactEmail}</span>}
            {store.contactPhone && <span className="flex items-center gap-1.5"><Phone className="size-4" /> {store.contactPhone}</span>}
          </div>
        )}
      </div>

      <div className="container mt-10">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold">All products</h2>
          <Select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} className="w-44" aria-label="Sort">
            <option value="popular">Popularity</option>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
            <option value="rating">Rating</option>
          </Select>
        </div>
        {!products.isLoading && !products.data?.items?.length ? (
          <div className="card"><EmptyState icon={Store} title="No products yet" description="This store hasn't listed any products yet." /></div>
        ) : (
          <>
            <ProductGrid products={products.data?.items || []} loading={products.isLoading} />
            <Pagination className="mt-8" page={page} pages={products.data?.pagination.pages} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
