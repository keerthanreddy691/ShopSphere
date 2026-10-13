import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, get, post } from '@/lib/api';

export const ROLE_HOME = { CUSTOMER: '/', SELLER: '/seller', ADMIN: '/admin', SUPPORT: '/support', DELIVERY: '/delivery' };

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => get('/auth/session').then((d) => d.user),
    staleTime: 5 * 60_000,
  });
  return { user: user ?? null, isLoading, isAuthenticated: Boolean(user), role: user?.role };
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => post('/auth/login', body),
    onSuccess: (res) => {
      qc.clear();
      qc.setQueryData(['me'], res.data.user);
      toast.success(res.message);
    },
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => post('/auth/register', body),
    onSuccess: (res) => {
      qc.clear();
      qc.setQueryData(['me'], res.data.user);
      toast.success(res.message);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSettled: () => {
      qc.clear();
      qc.setQueryData(['me'], null);
      toast.success('Logged out');
    },
  });
}
