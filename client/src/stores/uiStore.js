import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Client-only UI state. Server data (cart, user, products) lives in TanStack Query.
export const useUIStore = create(
  persist(
    (set) => ({
      mobileNavOpen: false,
      dashboardNavOpen: false,
      cartDrawerOpen: false,
      smartSearch: false,
      recentSearches: [],
      productView: 'grid',
      setMobileNav: (open) => set({ mobileNavOpen: open }),
      setDashboardNav: (open) => set({ dashboardNavOpen: open }),
      setCartDrawer: (open) => set({ cartDrawerOpen: open }),
      setSmartSearch: (on) => set({ smartSearch: on }),
      setProductView: (v) => set({ productView: v }),
      addRecentSearch: (q) =>
        set((s) => ({ recentSearches: [q, ...s.recentSearches.filter((x) => x !== q)].slice(0, 6) })),
      clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    {
      name: 'shopsphere-ui',
      storage: createJSONStorage(() => {
        try {
          return window.localStorage;
        } catch {
          return undefined;
        }
      }),
      partialize: (s) => ({ smartSearch: s.smartSearch, recentSearches: s.recentSearches, productView: s.productView }),
    },
  ),
);
