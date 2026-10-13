import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { get, post } from '@/lib/api';

export const useMyOrders = (params) =>
  useQuery({ queryKey: ['my-orders', params], queryFn: () => get('/orders/my', params), placeholderData: keepPreviousData });

export const useMyOrder = (id) => useQuery({ queryKey: ['my-order', id], queryFn: () => get(`/orders/my/${id}`).then((d) => d.order), enabled: Boolean(id) });

export const useCheckoutSummary = (checkoutId) =>
  useQuery({ queryKey: ['checkout', checkoutId], queryFn: () => get(`/orders/my/checkout/${checkoutId}`), enabled: Boolean(checkoutId) });

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => post(`/orders/my/${id}/cancel`, { reason }),
    onSuccess: (res) => {
      toast.success(res.message);
      qc.invalidateQueries({ queryKey: ['my-order'] });
      qc.invalidateQueries({ queryKey: ['my-orders'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (e) => toast.error(e.message),
  });
}
