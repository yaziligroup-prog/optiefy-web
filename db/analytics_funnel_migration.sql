-- ════════════════════════════════════════════════════════════════════════════
--  Optiefy — Dönüşüm Hunisi için Etkinlik Takibi Migrasyonu
--  Supabase SQL Editor'da bir kez çalıştırın.
-- ════════════════════════════════════════════════════════════════════════════

-- page_views tablosuna event_type alanı ekle (varsayılan: 'view')
alter table public.page_views
add column if not exists event_type text not null default 'view';

-- Bileşik indeks: mağaza + etkinlik + tarih sorguları için performans
create index if not exists page_views_store_event_idx
  on public.page_views (store_id, event_type, created_at desc);
