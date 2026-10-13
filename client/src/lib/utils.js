import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs) => twMerge(clsx(inputs));

export const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || 'U';

export const variantLabel = (options = {}) => Object.entries(options).map(([k, v]) => `${k}: ${v}`).join(' · ');

export const productImage = (p, i = 0) => p?.images?.[i] || p?.image || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&q=60';
