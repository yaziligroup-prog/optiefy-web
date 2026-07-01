"use client";

/**
 * Multi-tenant store context.
 * Tüm panel sayfaları bu context üzerinden aktif mağazayı okur.
 * Kullanıcı her zaman kendi mağazalarını görür (user_id izolasyonu /api/stores'da).
 */

import {
  createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode,
} from "react";
import type { Store } from "@/types/store";

// ─── Context type ─────────────────────────────────────────────────────────────

export type StoreCtx = {
  stores:           Store[];
  activeStore:      Store | null;
  activeStoreId:    string | null;
  setActiveStoreId: (id: string) => void;
  refreshStores:    (silent?: boolean) => Promise<void>;
  loading:          boolean;
};

const Ctx = createContext<StoreCtx | null>(null);

const LS_KEY = "sv-active-store";

// ─── Provider ─────────────────────────────────────────────────────────────────

export function StoreProvider({ children }: { children: ReactNode }) {
  const [stores,        setStores]        = useState<Store[]>([]);
  const [activeStoreId, setActiveStoreIdS] = useState<string | null>(null);
  const [loading,       setLoading]        = useState(true);
  const initialized                        = useRef(false);

  const refreshStores = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/stores", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as Store[];
        setStores(data);

        // İlk yüklemede localStorage'daki seçimi restore et; yoksa ilk mağazayı seç
        if (!initialized.current) {
          initialized.current = true;
          try {
            const saved = localStorage.getItem(LS_KEY);
            const valid = saved && data.some((s) => s.id === saved);
            setActiveStoreIdS(valid ? saved : (data[0]?.id ?? null));
          } catch {
            setActiveStoreIdS(data[0]?.id ?? null);
          }
        } else {
          // Refresh sonrası aktif mağaza hâlâ listede mi?
          setActiveStoreIdS((prev) => {
            if (!prev || data.some((s) => s.id === prev)) return prev;
            return data[0]?.id ?? null;
          });
        }
      }
    } catch { /* network error — sessiz */ }
    setLoading(false);
  }, []);

  useEffect(() => { refreshStores(); }, [refreshStores]);

  const setActiveStoreId = useCallback((id: string) => {
    setActiveStoreIdS(id);
    try { localStorage.setItem(LS_KEY, id); } catch { /* ignore */ }
  }, []);

  const activeStore = stores.find((s) => s.id === activeStoreId) ?? null;

  return (
    <Ctx.Provider value={{ stores, activeStore, activeStoreId, setActiveStoreId, refreshStores, loading }}>
      {children}
    </Ctx.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useActiveStore(): StoreCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useActiveStore, StoreProvider içinde kullanılmalıdır.");
  return ctx;
}
