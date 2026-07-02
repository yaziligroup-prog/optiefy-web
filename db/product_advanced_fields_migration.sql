-- Shopify standartlarında gelişmiş ürün alanları + performans indeksi.
-- NOT (2026-07-02): Bu migration'ın bir varyantı canlıda ZATEN UYGULANMIŞ —
-- canlı şemadaki gerçek kolon adları: images (image_urls değil) ve
-- continue_selling_out_of_stock (sell_when_out_of_stock değil); image_url
-- kolonu hiç yok. Kod bu adlara göre yazılmıştır. Dosya idempotenttir;
-- yeniden çalıştırmak güvenlidir ve eksikse performans indeksini ekler.
--
-- Alanlar:
--   images                        → çoklu ürün görseli (ilk eleman = ana/cover)
--   sku                           → stok kodu
--   stock_quantity                → stok adedi (null = takip edilmiyor / sınırsız)
--   continue_selling_out_of_stock → stok 0 olsa da satışa devam et
--   variants                      → jsonb: [{ "name": "Renk", "values": ["Kırmızı","Mavi"] }]
--   seo_title / seo_description   → Google meta alanları
--   slug                          → SEO dostu URL segmenti

alter table public.products
  add column if not exists images                        text[],
  add column if not exists sku                           text,
  add column if not exists stock_quantity                integer,
  add column if not exists continue_selling_out_of_stock boolean not null default false,
  add column if not exists variants                      jsonb,
  add column if not exists seo_title                     text,
  add column if not exists seo_description               text,
  add column if not exists slug                          text;

-- Ürün listesi sorgusunu hızlandıran bileşik indeks (store_id + created_at desc)
create index if not exists idx_products_store_created
  on public.products (store_id, created_at desc);

comment on column public.products.variants is
  'Varyant seçenekleri: [{"name":"Renk","values":["Kırmızı","Mavi"]}]';
