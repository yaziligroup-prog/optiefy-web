-- Canlı Tema Editörü — stores.theme_settings jsonb kolonu
-- Supabase SQL Editor'de bir kez çalıştırın.
--
-- Örnek veri:
-- { "announcement_text": "2000 TL üzeri ücretsiz kargo!", "primary_color": "#7C3AED", "button_radius": 12 }

alter table public.stores
  add column if not exists theme_settings jsonb;

comment on column public.stores.theme_settings is
  'Canlı Tema Editörü özelleştirmeleri: announcement_text (text), primary_color (hex), button_radius (px int)';
