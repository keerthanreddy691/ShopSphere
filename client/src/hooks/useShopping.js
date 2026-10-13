import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { get, post, patch, del } from '@/lib/api';
import { useAuth } from './useAuth';

// ---------- Cart ----------
export function useCart() {
  const { role } = useAuth();
  return useQuery({ queryKey: ['cart'], queryFn: () => get('/cart'), enabled: role === 'CUSTOMER' });
}

export function useCartCount() {
  const { data } = useCart();
  return data?.summary?.itemCount || 0;
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => post('/cart/items', body),
    onSuccess: (res) => {
      qc.setQueryData(['cart'], res.data);
      toast.success(res.message || 'Added to cart');
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, quantity }) => patch(`/cart/items/${itemId}`, { quantity }),
    onSuccess: (res) => qc.setQueryData(['cart'], res.data),
    onError: (e) => toast.error(e.message),
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId) => del(`/cart/items/${itemId}`),
    onSuccess: (res) => {
      qc.setQueryData(['cart'], res.data);
      toast.success('Removed from cart');
    },
    onError: (e) => toast.error(e.message),
  });
}

// ---------- Wishlist ----------
export function useWishlist() {
  const { role } = useAuth();
  return useQuery({ queryKey: ['wishlist'], queryFn: () => get('/wishlist').then((d) => d.products), enabled: role === 'CUSTOMER' });
}

export function useWishlistIds() {
  const { data } = useWishlist();
  return new Set((data || []).map((p) => p._id));
}

export function useToggleWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, inWishlist }) => (inWishlist ? del(`/wishlist/${productId}`) : post(`/wishlist/${productId}`)),
    onSuccess: (res, { inWishlist }) => {
      qc.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success(inWishlist ? 'Removed from wishlist' : 'Saved to wishlist');
    },
    onError: (e) => toast.error(e.message),
  });
}

// ---------- Notifications ----------
export function useNotifications(params = { limit: 8 }) {
  const { isAuthenticated } = useAuth();
  return useQuery({ queryKey: ['notifications', params], queryFn: () => get('/notifications', params), enabled: isAuthenticated, refetchInterval: 30_000 });
}

export function useMarkNotifications() {
  const qc = useQueryClient();
  const done = () => qc.invalidateQueries({ queryKey: ['notifications'] });
  return {
    markOne: useMutation({ mutationFn: (id) => patch(`/notifications/${id}/read`), onSuccess: done }),
    markAll: useMutation({ mutationFn: () => patch('/notifications/read-all'), onSuccess: done }),
  };
}
