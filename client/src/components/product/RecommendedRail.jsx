import { useQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { get } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { ProductRail } from './ProductRail';
import { Badge } from '@/components/ui/badge';

// "Recommended for you" — personalised from browsing, wishlist, cart and purchases,
// with a popularity fallback for guests and new users.
export function RecommendedRail({ title, subtitle }) {
  const { user } = useAuth();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['recommendations', user?._id || 'guest'],
    queryFn: () => get('/ai/recommendations', { limit: 10 }),
    staleTime: 60_000,
  });
  if (isError) return null;
  const reasons = Object.fromEntries((data?.items || []).map((i) => [i.product._id, i.reason]));
  return (
    <ProductRail
      title={title || (data?.personalized ? 'Recommended for you' : 'Popular picks for you')}
      subtitle={subtitle || (data?.personalized ? 'Based on your browsing, wishlist, cart and past orders' : 'Trending across ShopSphere — browse a little and we will personalise this')}
      icon={Sparkles}
      badge={<Badge variant="purple" className="ml-1"><Sparkles className="size-3" /> AI</Badge>}
      products={data?.items?.map((i) => i.product)}
      reasons={reasons}
      loading={isLoading}
    />
  );
}
