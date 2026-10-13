import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { SlidersHorizontal, X, SearchX, Star, ChevronRight } from 'lucide-react';
import { useCategories, useProducts, useBrands } from '@/hooks/useCatalog';
import { useDebounce } from '@/hooks/useDebounce';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/ui/button';
import { Input, Select, Checkbox, Switch } from '@/components/ui/input';
import { Sheet } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { formatNumber, formatPrice } from '@/lib/format';

const SORTS = [
  ['relevance', 'Relevance'],
  ['popular', 'Popularity'],
  ['newest', 'Newest first'],
  ['price_asc', 'Price: low to high'],
  ['price_desc', 'Price: high to low'],
  ['rating', 'Customer rating'],
  ['discount', 'Biggest discount'],
];
const PRICE_PRESETS = [[0, 999], [1000, 4999], [5000, 19999], [20000, 49999], [50000, '']];
const DISCOUNTS = [10, 25, 40, 50];

function FilterSection({ title, children }) {
  return (
    <div className="border-b border-slate-100 py-5 first:pt-0 last:border-0">
      <p className="mb-3 text-sm font-semibold">{title}</p>
      {children}
    </div>
  );
}

function Filters({ params, set, fixedCategory }) {
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();
  const [min, setMin] = useState(params.get('minPrice') || '');
  const [max, setMax] = useState(params.get('maxPrice') || '');
  const [showAllBrands, setShowAllBrands] = useState(false);
  useEffect(() => {
    setMin(params.get('minPrice') || '');
    setMax(params.get('maxPrice') || '');
  }, [params]);
  const selectedCats = (params.get('category') || '').split(',').filter(Boolean);
  const selectedBrands = (params.get('brand') || '').split(',').filter(Boolean);
  const toggleList = (key, list, value) => {
    const next = list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
    set({ [key]: next.join(',') });
  };

  return (
    <div>
      {!fixedCategory && (
        <FilterSection title="Category">
          <div className="space-y-2.5">
            {categories.map((c) => (
              <Checkbox key={c._id} label={<span className="flex-1">{c.name} <span className="text-xs text-slate-400">({c.productCount})</span></span>} checked={selectedCats.includes(c.slug)} onChange={() => toggleList('category', selectedCats, c.slug)} />
            ))}
          </div>
        </FilterSection>
      )}
      <FilterSection title="Price">
        <div className="flex items-center gap-2">
          <Input type="number" min="0" placeholder="Min ₹" value={min} onChange={(e) => setMin(e.target.value)} className="h-9" aria-label="Minimum price" />
          <span className="text-slate-400">–</span>
          <Input type="number" min="0" placeholder="Max ₹" value={max} onChange={(e) => setMax(e.target.value)} className="h-9" aria-label="Maximum price" />
          <Button size="sm" variant="outline" className="h-9" onClick={() => set({ minPrice: min, maxPrice: max })}>Go</Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {PRICE_PRESETS.map(([a, b]) => {
            const active = params.get('minPrice') === String(a) && (params.get('maxPrice') || '') === String(b);
            return (
              <button key={a} onClick={() => set({ minPrice: String(a), maxPrice: String(b) })} className={cn('rounded-lg border px-2.5 py-1 text-xs font-medium transition', active ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-slate-200 text-ink-soft hover:border-slate-300')}>
                {b === '' ? `${formatPrice(a)}+` : `${formatPrice(a)} – ${formatPrice(b)}`}
              </button>
            );
          })}
        </div>
      </FilterSection>
      <FilterSection title="Customer rating">
        <div className="space-y-1">
          {[4, 3, 2].map((r) => (
            <button key={r} onClick={() => set({ rating: params.get('rating') === String(r) ? '' : String(r) })} className={cn('flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition', params.get('rating') === String(r) ? 'bg-brand-50 font-semibold text-brand-700' : 'text-ink-soft hover:bg-slate-50')}>
              {r} <Star className="size-3.5 fill-amber-400 text-amber-400" /> & above
            </button>
          ))}
        </div>
      </FilterSection>
      <FilterSection title="Discount">
        <div className="space-y-1">
          {DISCOUNTS.map((d) => (
            <button key={d} onClick={() => set({ discount: params.get('discount') === String(d) ? '' : String(d) })} className={cn('flex w-full rounded-lg px-2 py-1.5 text-sm transition', params.get('discount') === String(d) ? 'bg-brand-50 font-semibold text-brand-700' : 'text-ink-soft hover:bg-slate-50')}>
              {d}% or more
            </button>
          ))}
        </div>
      </FilterSection>
      <FilterSection title="Availability">
        <label className="flex items-center justify-between text-sm text-ink-soft">
          In stock only
          <Switch checked={params.get('inStock') === 'true'} onChange={(v) => set({ inStock: v ? 'true' : '' })} label="In stock only" />
        </label>
      </FilterSection>
      {brands.length > 0 && (
        <FilterSection title="Brand">
          <div className="space-y-2.5">
            {(showAllBrands ? brands : brands.slice(0, 8)).map((b) => (
              <Checkbox key={b} label={b} checked={selectedBrands.includes(b)} onChange={() => toggleList('brand', selectedBrands, b)} />
            ))}
          </div>
          {brands.length > 8 && (
            <button onClick={() => setShowAllBrands((s) => !s)} className="mt-3 text-xs font-semibold text-brand-600 hover:underline">
              {showAllBrands ? 'Show less' : `Show all ${brands.length} brands`}
            </button>
          )}
        </FilterSection>
      )}
    </div>
  );
}

export default function ProductsPage({ mode }) {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { data: categories = [] } = useCategories();
  const [q, setQ] = useState(params.get('q') || '');
  const debouncedQ = useDebounce(q, 400);

  const set = (updates) => {
    const next = new URLSearchParams(params);
    Object.entries(updates).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in updates)) next.delete('page');
    setParams(next, { replace: true });
  };

  // Keep the in-page search box and the URL in sync (debounced).
  useEffect(() => {
    setQ(params.get('q') || '');
  }, [params]);
  useEffect(() => {
    if ((params.get('q') || '') !== debouncedQ) set({ q: debouncedQ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  const query = useMemo(() => {
    const obj = Object.fromEntries(params.entries());
    if (slug) obj.category = slug;
    if (mode === 'deals') {
      obj.discount = obj.discount || '25';
      obj.sort = obj.sort || 'discount';
    }
    obj.limit = 12;
    return obj;
  }, [params, slug, mode]);

  const { data, isLoading, isFetching, isError, error, refetch } = useProducts(query);
  const category = slug ? categories.find((c) => c.slug === slug) : null;
  const title = mode === 'deals' ? "Today's deals" : category?.name || (params.get('q') ? `Results for “${params.get('q')}”` : params.get('featured') ? 'Featured products' : 'All products');
  const subtitle = mode === 'deals' ? 'Handpicked discounts of 25% and more' : category?.description;

  const chips = [];
  if (!slug && params.get('category')) params.get('category').split(',').forEach((c) => chips.push({ label: categories.find((x) => x.slug === c)?.name || c, clear: () => set({ category: params.get('category').split(',').filter((x) => x !== c).join(',') }) }));
  if (params.get('brand')) params.get('brand').split(',').forEach((b) => chips.push({ label: b, clear: () => set({ brand: params.get('brand').split(',').filter((x) => x !== b).join(',') }) }));
  if (params.get('minPrice') || params.get('maxPrice')) chips.push({ label: `${params.get('minPrice') ? formatPrice(params.get('minPrice')) : '₹0'} – ${params.get('maxPrice') ? formatPrice(params.get('maxPrice')) : 'any'}`, clear: () => set({ minPrice: '', maxPrice: '' }) });
  if (params.get('rating')) chips.push({ label: `${params.get('rating')}★ & above`, clear: () => set({ rating: '' }) });
  if (params.get('discount')) chips.push({ label: `${params.get('discount')}%+ off`, clear: () => set({ discount: '' }) });
  if (params.get('inStock')) chips.push({ label: 'In stock', clear: () => set({ inStock: '' }) });
  if (params.get('featured')) chips.push({ label: 'Featured', clear: () => set({ featured: '' }) });
  const clearAll = () => setParams(new URLSearchParams(), { replace: true });

  return (
    <div className="container py-6 sm:py-8">
      <nav className="mb-3 flex items-center gap-1 text-xs text-ink-muted">
        <Link to="/" className="hover:text-ink">Home</Link>
        <ChevronRight className="size-3" />
        {category ? <><Link to="/products" className="hover:text-ink">Products</Link><ChevronRight className="size-3" /><span className="text-ink">{category.name}</span></> : <span className="text-ink">{mode === 'deals' ? 'Deals' : 'Products'}</span>}
      </nav>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {subtitle ? `${subtitle} · ` : ''}
            {data ? `${formatNumber(data.pagination.total)} products` : 'Loading…'}
          </p>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Search within results…" value={q} onChange={(e) => setQ(e.target.value)} className="w-full sm:w-56" aria-label="Search within results" />
          <Select value={params.get('sort') || (mode === 'deals' ? 'discount' : 'relevance')} onChange={(e) => set({ sort: e.target.value })} className="w-44 shrink-0" aria-label="Sort products">
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
          <Button variant="outline" className="lg:hidden" onClick={() => setFiltersOpen(true)} aria-label="Open filters">
            <SlidersHorizontal /> <span className="hidden sm:inline">Filters</span>
            {chips.length > 0 && <span className="rounded-full bg-brand-600 px-1.5 text-[10px] text-white">{chips.length}</span>}
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-36 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold">Filters</p>
              {chips.length > 0 && <button onClick={clearAll} className="text-xs font-semibold text-brand-600 hover:underline">Clear all</button>}
            </div>
            <Filters params={params} set={set} fixedCategory={Boolean(slug)} />
          </div>
        </aside>

        <div className="min-w-0">
          {chips.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {chips.map((c) => (
                <button key={c.label} onClick={c.clear} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-ink-soft hover:border-slate-300">
                  {c.label} <X className="size-3" />
                </button>
              ))}
              <button onClick={clearAll} className="text-xs font-semibold text-brand-600 hover:underline">Clear all</button>
            </div>
          )}
          {isError ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : !isLoading && !data?.items?.length ? (
            <div className="card">
              <EmptyState
                icon={SearchX}
                title="No products match your filters"
                description="Try removing a filter, widening the price range or searching for something else. You can also try AI Smart Search."
                action={
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={clearAll}>Clear filters</Button>
                    {params.get('q') && <Link to={`/search/smart?q=${encodeURIComponent(params.get('q'))}`}><Button variant="soft">Try Smart Search</Button></Link>}
                  </div>
                }
              />
            </div>
          ) : (
            <div className={cn('transition-opacity', isFetching && !isLoading && 'opacity-60')}>
              <ProductGrid products={data?.items || []} loading={isLoading} skeletons={12} className="xl:grid-cols-3 2xl:grid-cols-4" />
              <Pagination className="mt-10" page={data?.pagination.page || 1} pages={data?.pagination.pages} onChange={(p) => { set({ page: String(p) }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
            </div>
          )}
        </div>
      </div>

      <Sheet open={filtersOpen} onClose={() => setFiltersOpen(false)} side="right" title="Filters">
        <div className="p-4">
          <Filters params={params} set={set} fixedCategory={Boolean(slug)} />
        </div>
        <div className="sticky bottom-0 grid grid-cols-2 gap-2 border-t border-slate-100 bg-white p-3">
          <Button variant="outline" onClick={clearAll}>Clear all</Button>
          <Button onClick={() => setFiltersOpen(false)}>Show {data?.pagination.total ?? ''} results</Button>
        </div>
      </Sheet>
    </div>
  );
}
