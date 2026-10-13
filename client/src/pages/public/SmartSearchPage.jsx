import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, SearchX } from 'lucide-react';
import { get } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { ProductGrid } from '@/components/product/ProductGrid';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// AI Smart Search — the API turns a natural-language query into keywords, category and price filters.
export default function SmartSearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q')?.trim() || '';
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['smart-search', q],
    queryFn: () => get('/ai/smart-search', { q }),
    enabled: Boolean(q),
    staleTime: 60_000,
  });

  const items = data?.items || [];
  const meta = data?.interpretation;
  const reasons = Object.fromEntries(items.map((i) => [i.product._id, i.reason]));

  return (
    <div className="container py-6 sm:py-8">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Sparkles className="size-6 text-violet-600" /> Smart search
          </span>
        }
        description={q ? `Results for “${q}”` : 'Describe what you need in your own words'}
      />

      {meta && (
        <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-ink-muted">
          <span>Understood as:</span>
          {meta.keywords.map((k) => <Badge key={k} variant="purple">{k}</Badge>)}
          {meta.category && <Badge>{meta.category}</Badge>}
          {meta.minPrice && <Badge>From {formatPrice(meta.minPrice)}</Badge>}
          {meta.maxPrice && <Badge>Up to {formatPrice(meta.maxPrice)}</Badge>}
        </div>
      )}

      {!q ? (
        <EmptyState icon={Sparkles} title="What are you looking for?" description='Try something like “comfortable shoes for long walks” or “headphones under 30000”.' />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !isLoading && !items.length ? (
        <EmptyState
          icon={SearchX}
          title="No matches found"
          description="Try describing it differently, or browse the full catalog."
          action={<Link to={`/products?q=${encodeURIComponent(q)}`}><Button variant="outline">Try a regular search</Button></Link>}
        />
      ) : (
        <ProductGrid products={items.map((i) => i.product)} reasons={reasons} loading={isLoading} />
      )}
    </div>
  );
}
