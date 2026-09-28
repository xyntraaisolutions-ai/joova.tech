"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type WishlistItem = {
  id: string;
  name: string;
  href: string;
  note?: string;
};

type WishlistContextValue = {
  items: WishlistItem[];
  count: number;
  has: (id: string) => boolean;
  addItem: (item: WishlistItem) => void;
  removeItem: (id: string) => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);
const STORAGE_KEY = "joova-wishlist";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as WishlistItem[]);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((item: WishlistItem) => {
    setItems((current) =>
      current.some((row) => row.id === item.id) ? current : [...current, item],
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((row) => row.id !== id));
  }, []);

  const has = useCallback(
    (id: string) => items.some((row) => row.id === id),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      count: items.length,
      has,
      addItem,
      removeItem,
    }),
    [items, has, addItem, removeItem],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
