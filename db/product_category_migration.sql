-- Ürün kategori bağlantısı — nav alt menü slug'ı ile eşleşir.
-- Supabase SQL Editor'de bir kez çalıştırın.
--
-- Örnek: nav alt menüsü "/urunler/yeni-urunler" → products.category = 'yeni-urunler'

alter table public.products
  add column if not exists category text;

comment on column public.products.category is
  'Nav alt menü kategori slug''ı (url son segmenti) — vitrin /urunler/<slug> filtrelemesi';
