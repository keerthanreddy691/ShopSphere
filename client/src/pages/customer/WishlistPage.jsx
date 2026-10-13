import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useWishlist, useToggleWishlist, useAddToCart } from '@/hooks/useShopping';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { SafeImage } from '@/components/common/SafeImage';
import { formatPrice } from '@/lib/format';

export default function WishlistPage() {
  const { data: products = [], isLoading, isError, error, refetch } = useWishlist();
  const toggleWishlist = useToggleWishlist();
  const addToCart = useAddToCart();

  if (isLoading) {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold">My Wishlist</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container py-8">
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="container py-6 sm:py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Wishlist</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {products.length} {products.length === 1 ? 'item' : 'items'} saved for later
          </p>
        </div>
      </div>

      {!products.length ? (
        <Card className="mt-6">
          <EmptyState
            icon={Heart}
            title="Your wishlist is empty"
            description="Explore products and tap the heart icon to save items you love."
            action={
              <Link to="/products">
                <Button>Explore Products</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => {
            const price = Math.round(p.price * (1 - (p.discount || 0) / 100));
            return (
              <Card key={p._id} className="group flex flex-col overflow-hidden">
                <Link to={`/product/${p.slug}`} className="relative aspect-square overflow-hidden bg-slate-50">
                  <SafeImage
                    src={p.images?.[0]}
                    alt={p.name}
                    className="size-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  {p.discount > 0 && (
                    <span className="absolute left-2.5 top-2.5 rounded-lg bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">
                      {p.discount}% OFF
                    </span>
                  )}
                </Link>

                <div className="flex flex-1 flex-col p-4">
                  {p.brand && <p className="text-xs font-medium uppercase text-ink-muted">{p.brand}</p>}
                  <Link
                    to={`/product/${p.slug}`}
                    className="mt-1 line-clamp-2 text-sm font-semibold hover:text-brand-600"
                  >
                    {p.name}
                  </Link>

                  <div className="mt-auto pt-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-bold">{formatPrice(price)}</span>
                      {p.discount > 0 && (
                        <span className="text-xs text-ink-muted line-through">{formatPrice(p.price)}</span>
                      )}
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 gap-1.5"
                        disabled={p.stock <= 0}
                        onClick={() => {
                          addToCart.mutate(
                            { productId: p._id, quantity: 1 },
                            { onSuccess: () => toggleWishlist.mutate({ productId: p._id, inWishlist: true }) },
                          );
                        }}
                      >
                        <ShoppingBag className="size-4" /> Move to Cart
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        aria-label="Remove"
                        onClick={() => toggleWishlist.mutate({ productId: p._id, inWishlist: true })}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

