import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Search, Sparkles, Clock, X, ArrowUpRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';
import { useUIStore } from '@/stores/uiStore';
import { formatPrice } from '@/lib/format';
import { cn, productImage } from '@/lib/utils';

export function SearchBar({ className, autoFocus, onDone }) {
  const [params] = useSearchParams();
  const [value, setValue] = useState(params.get('q') || '');
  const [focused, setFocused] = useState(false);
  const smart = useUIStore((s) => s.smartSearch);
  const setSmart = useUIStore((s) => s.setSmartSearch);
  const recent = useUIStore((s) => s.recentSearches);
  const addRecent = useUIStore((s) => s.addRecentSearch);
  const clearRecent = useUIStore((s) => s.clearRecentSearches);
  const navigate = useNavigate();
  const wrap = useRef(null);
  const debounced = useDebounce(value.trim(), 300);

  useEffect(() => {
    setValue(params.get('q') || '');
  }, [params]);
  useEffect(() => {
    const onDoc = (e) => wrap.current && !wrap.current.contains(e.target) && setFocused(false);
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const { data: suggestions } = useQuery({
    queryKey: ['suggest', debounced],
    queryFn: () => get('/products', { q: debounced, limit: 5 }).then((d) => d.items),
    enabled: focused && !smart && debounced.length >= 2,
    staleTime: 60_000,
  });

  const submit = (q = value) => {
    const term = q.trim();
    if (!term) return;
    addRecent(term);
    setFocused(false);
    onDone?.();
    navigate(smart ? `/search/smart?q=${encodeURIComponent(term)}` : `/products?q=${encodeURIComponent(term)}`);
  };

  const showPanel = focused && (debounced.length >= 2 ? !smart && suggestions?.length : recent.length > 0);

  return (
    <div ref={wrap} className={cn('relative w-full', className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className={cn('flex h-11 items-center rounded-xl border bg-slate-50 transition focus-within:bg-white focus-within:ring-4', smart ? 'border-violet-300 focus-within:ring-violet-100' : 'border-slate-200 focus-within:border-brand-300 focus-within:ring-brand-100')}
      >
        {smart ? <Sparkles className="ml-3.5 size-4 shrink-0 text-violet-500" /> : <Search className="ml-3.5 size-4 shrink-0 text-slate-400" />}
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          autoFocus={autoFocus}
          placeholder={smart ? 'Describe what you need… e.g. "comfortable shoes for long walks"' : 'Search for products, brands and more'}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-slate-400"
          aria-label="Search products"
        />
        {value && (
          <button type="button" onClick={() => setValue('')} className="p-1 text-slate-400 hover:text-ink" aria-label="Clear search">
            <X className="size-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => setSmart(!smart)}
          title="Toggle AI Smart Search"
          className={cn('mr-1.5 ml-1 inline-flex h-8 shrink-0 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold transition', smart ? 'bg-violet-600 text-white' : 'bg-white text-ink-soft ring-1 ring-slate-200 hover:text-violet-600')}
        >
          <Sparkles className="size-3.5" />
          <span className="hidden sm:inline">Smart</span>
        </button>
      </form>

      {showPanel ? (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-lift">
          {debounced.length >= 2 && suggestions?.length ? (
            <>
              {suggestions.map((p) => (
                <Link key={p._id} to={`/product/${p.slug}`} onClick={() => { setFocused(false); onDone?.(); }} className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-50">
                  <img src={productImage(p)} alt="" className="size-10 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-ink-muted">{p.category?.name} · {formatPrice(p.finalPrice)}</p>
                  </div>
                  <ArrowUpRight className="size-4 text-slate-300" />
                </Link>
              ))}
              <button onClick={() => submit()} className="w-full rounded-lg p-2 text-left text-sm font-medium text-brand-600 hover:bg-brand-50">
                See all results for “{debounced}”
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Recent searches
                <button onClick={clearRecent} className="normal-case text-brand-600 hover:underline">Clear</button>
              </div>
              {recent.map((r) => (
                <button key={r} onClick={() => { setValue(r); submit(r); }} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-50">
                  <Clock className="size-4 text-slate-400" /> {r}
                </button>
              ))}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
