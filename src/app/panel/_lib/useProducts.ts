"use client";

/**
 * Ürün listesi için hafif stale-while-revalidate cache hook'u.
 *
 * - Bellek (module Map) + sessionStorage iki katmanlı önbellek: sayfa geçişlerinde
 *   liste anında render edilir, arka planda sessizce tazelenir (SWR mantığı).
 * - Aynı mağaza için eşzamanlı istekler tekilleştirilir (in-flight dedupe).
 * - mutate() ile optimistic güncellemeler cache'e de yazılır.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { Product } from "@/types/store";

const mem = new Map<string, Product[]>();
const inflight = new Map<string, Promise<Product[] | null>>();
const SS_PREFIX = "sv-products:";

function readSession(storeId: string): Product[] | null {
  try {
    const raw = sessionStorage.getItem(SS_PREFIX + storeId);
    return raw ? (JSON.parse(raw) as Product[]) : null;
  } catch {
    return null;
  }
}

function writeCache(storeId: string, data: Product[]) {
  mem.set(storeId, data);
  try {
    sessionStorage.setItem(SS_PREFIX + storeId, JSON.stringify(data));
  } catch {
    /* quota — bellek cache yeterli */
  }
}

async function fetchProductsDeduped(storeId: string): Promise<Product[] | null> {
  const existing = inflight.get(storeId);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const res = await fetch(`/api/products?storeId=${storeId}`, { cache: "no-store" });
      if (!res.ok) return null;
      return (await res.json()) as Product[];
    } catch {
      return null;
    } finally {
      inflight.delete(storeId);
    }
  })();

  inflight.set(storeId, promise);
  return promise;
}

export function useProducts(storeId: string | null) {
  const [products, setProducts] = useState<Product[] | null>(() =>
    storeId ? (mem.get(storeId) ?? null) : null
  );
  const [loading, setLoading] = useState(() => !!storeId && !mem.has(storeId));
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const sidRef = useRef(storeId);
  sidRef.current = storeId;

  const revalidate = useCallback(async () => {
    const sid = sidRef.current;
    if (!sid) return;
    if (mem.has(sid)) setRefreshing(true);
    else setLoading(true);

    const data = await fetchProductsDeduped(sid);

    // Bekleme sırasında mağaza değiştiyse sonucu uygulama
    if (sidRef.current !== sid) return;
    if (data) {
      writeCache(sid, data);
      setProducts(data);
      setError(false);
    } else if (!mem.has(sid)) {
      setError(true);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    if (!storeId) {
      setProducts(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    // Önce cache'ten anında göster (bellek → sessionStorage), sonra tazele
    const cached = mem.get(storeId) ?? readSession(storeId);
    if (cached) {
      mem.set(storeId, cached);
      setProducts(cached);
      setLoading(false);
    } else {
      setProducts(null);
      setLoading(true);
    }
    setError(false);
    revalidate();
  }, [storeId, revalidate]);

  /** Optimistic güncelleme — state ile birlikte cache'e de yazar. */
  const mutate = useCallback((updater: (prev: Product[]) => Product[]) => {
    setProducts((prev) => {
      const next = updater(prev ?? []);
      if (sidRef.current) writeCache(sidRef.current, next);
      return next;
    });
  }, []);

  return { products, loading, refreshing, error, mutate, revalidate };
}
