"use client";

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  drawerOpen: boolean;
  checkoutOpen: boolean;
  count: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, delta: number) => void;
  clear: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  openCheckout: () => void;
  closeCheckout: () => void;
}

// ─── Helper ─────────────────────────────────────────────────────────────────────

export const formatTRY = (n: number) =>
  n.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " ₺";

export const formatPrice = (n: number, currency?: string | null) =>
  currency === "USD"
    ? "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2 })
    : n.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " ₺";

// ─── Context ────────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems]               = useState<CartItem[]>([]);
  const [drawerOpen, setDrawerOpen]     = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const addItem = useCallback((item: Omit<CartItem, "quantity">, qty = 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id);
      if (idx >= 0) {
        return prev.map((i, j) => (j === idx ? { ...i, quantity: i.quantity + qty } : i));
      }
      return [...prev, { ...item, quantity: qty }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQty = useCallback((id: string, delta: number) => {
    setItems((prev) =>
      prev.flatMap((i) => {
        if (i.id !== id) return [i];
        const q = i.quantity + delta;
        return q <= 0 ? [] : [{ ...i, quantity: q }];
      })
    );
  }, []);

  const clear         = useCallback(() => setItems([]), []);
  const openDrawer    = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer   = useCallback(() => setDrawerOpen(false), []);
  const openCheckout  = useCallback(() => { setDrawerOpen(false); setCheckoutOpen(true); }, []);
  const closeCheckout = useCallback(() => setCheckoutOpen(false), []);

  const count    = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items, drawerOpen, checkoutOpen, count, subtotal,
      addItem, removeItem, updateQty, clear,
      openDrawer, closeDrawer, openCheckout, closeCheckout,
    }),
    [items, drawerOpen, checkoutOpen, count, subtotal, addItem, removeItem, updateQty, clear, openDrawer, closeDrawer, openCheckout, closeCheckout]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart, CartProvider içinde kullanılmalıdır.");
  return ctx;
}
