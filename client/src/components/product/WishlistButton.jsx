import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useToggleWishlist, useWishlistIds } from '@/hooks/useShopping';
import { cn } from '@/lib/utils';

export function WishlistButton({ productId, className, withLabel }) {
  const { user } = useAuth();
  const ids = useWishlistIds();
  const toggle = useToggleWishlist();
  const navigate = useNavigate();
  const active = ids.has(productId);
  const onClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.info('Log in to save items to your wishlist');
      return navigate('/login');
    }
    if (user.role !== 'CUSTOMER') return toast.info('Wishlists are available for customer accounts');
    toggle.mutate({ productId, inWishlist: active });
  };
  return (
    <button
      onClick={onClick}
      disabled={toggle.isPending}
      aria-pressed={active}
      aria-label={active ? 'Remove from wishlist' : 'Add to wishlist'}
      className={cn(
        'inline-flex items-center justify-center gap-2 transition',
        withLabel ? 'h-12 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold hover:bg-slate-50' : 'size-9 rounded-full bg-white/95 shadow-sm ring-1 ring-slate-200 hover:scale-105',
        className,
      )}
    >
      <Heart className={cn('size-[18px]', active ? 'fill-rose-500 text-rose-500' : 'text-slate-500')} />
      {withLabel && (active ? 'Wishlisted' : 'Wishlist')}
    </button>
  );
}
