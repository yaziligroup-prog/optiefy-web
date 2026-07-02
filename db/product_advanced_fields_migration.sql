-- Shopify standartlarında gelişmiş ürün alanları + performans indeksi.
-- Supabase SQL Editor'de bir kez çalıştırın.
--
-- Yeni alanlar:
--   image_urls             → çoklu ürün görseli (ilk eleman = ana/cover görsel, image_url ile senkron)
--   sku                    → stok kodu
--   stock_quantity         → stok adedi (null = takip edilmiyor / sınırsız)
--   sell_when_out_of_stock → stok 0 olsa da satışa devam et
--   variants               → varyant seçenekleri, jsonb: [{ "name": "Renk", "values": ["Kırmızı","Mavi"] }]
--   seo_title              → Google meta başlık
--   seo_description        → Google meta açıklama
--   slug                   → SEO dostu URL segmenti

alter table public.products
  add column if not exists image_urls             text[],
  add column if not exists sku                    text,
  add column if not exists stock_quantity         integer,
  add column if not exists sell_when_out_of_stock boolean not null default false,
  add column if not exists variants               jsonb,
  add column if not exists seo_title              text,
  add column if not exists seo_description        text,
  add column if not exists slug                   text;

-- Mevcut tekil görselleri çoklu görsel dizisine taşı
update public.products
  set image_urls = array[image_url]
  where image_url is not null
    and (image_urls is null or array_length(image_urls, 1) is null);

-- Ürün listesi sorgusunu hızlandıran bileşik indeks (store_id + created_at desc)
create index if not exists idx_products_store_created
  on public.products (store_id, created_at desc);

comment on column public.products.variants is
  'Varyant seçenekleri: [{"name":"Renk","values":["Kırmızı","Mavi"]}]';
