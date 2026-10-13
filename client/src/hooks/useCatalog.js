import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { get } from '@/lib/api';

export const useCategories = () =>
  useQuery({ queryKey: ['categories'], queryFn: () => get('/categories').then((d) => d.categories), staleTime: 5 * 60_000 });

export const useProducts = (params, options = {}) =>
  useQuery({ queryKey: ['products', params], queryFn: () => get('/products', params), placeholderData: keepPreviousData, ...options });

export const useProduct = (slug) =>
  useQuery({ queryKey: ['product', slug], queryFn: () => get(`/products/${slug}`).then((d) => d.product), enabled: Boolean(slug) });

export const useBrands = () => useQuery({ queryKey: ['brands'], queryFn: () => get('/products/brands').then((d) => d.brands), staleTime: 5 * 60_000 });

export const useStores = (params) => useQuery({ queryKey: ['stores', params], queryFn: () => get('/stores', params).then((d) => d.stores), staleTime: 60_000 });

export const useStore = (slug) => useQuery({ queryKey: ['store', slug], queryFn: () => get(`/stores/${slug}`).then((d) => d.store), enabled: Boolean(slug) });
