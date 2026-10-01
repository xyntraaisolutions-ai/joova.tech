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

export type CartItem = {
  id: string;
  productId?: string;
  sku?: string;
  name: string;
  price: number;
  quantity: number;
  color?: string;
  selection?: {
    color?: string;
    type?: string;
    size?: string;
    custom?: string;
    sku?: string;
  };
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "joova-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
      setItems((current) => {
        const existing = current.find((row) => row.id === item.id);
        if (existing) {
          return current.map((row) =>
            row.id === item.id
              ? { ...row, quantity: row.quantity + (item.quantity ?? 1) }
              : row,
          );
        }
        return [...current, { ...item, quantity: item.quantity ?? 1 }];
      });
      setOpen(true);
    },
    [],
  );

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setItems((current) =>
      quantity < 1
        ? current.filter((row) => row.id !== id)
        : current.map((row) => (row.id === id ? { ...row, quantity } : row)),
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((row) => row.id !== id));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      open,
      setOpen,
      addItem,
      updateQuantity,
      removeItem,
      clear,
    }),
    [items, open, addItem, updateQuantity, removeItem, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
