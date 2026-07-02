-- ────────────────────────────────────────────────────────────────────────────
-- PRODUCTS tablosu Row Level Security politikaları
-- Supabase SQL Editor'de bir kez çalıştırın.
--
-- Mevcut durum tespiti (2026-07-02, REST probe'larıyla doğrulandı):
--   • products: RLS AÇIK, yazma korunuyor (anon insert → 42501 ✓)
--     ANCAK public SELECT policy'si YOK → vitrin (anon istemci) ürünleri
--     GÖREMİYOR; canlı mağaza sayfaları boş ürün listesi basıyor. Bu dosya
--     bunu düzeltir.
--   • stores: RLS AÇIK, public SELECT var, anon yazma engelli ✓ (aynı-değer
--     UPDATE probe'u boş döndü) — dokunmaya gerek yok.
--   • Panel API'leri service role ile çalışır (RLS'i bypass eder); sahiplik
--     kontrolü API katmanında ayrıca yapılır. Buradaki politikalar, anon key
--     ile doğrudan PostgREST'e giden istekleri kilitleyen ikinci savunma hattıdır.
-- ────────────────────────────────────────────────────────────────────────────

-- 0) Veri düzeltmesi: generate-store ile oluşturulan eski ürünlerde user_id
--    null kalmış — mağaza sahibinden geri doldur.
update public.products p
   set user_id = s.user_id
  from public.stores s
 where s.id = p.store_id
   and p.user_id is null;

-- 1) RLS açık olduğundan emin ol (idempotent)
alter table public.products enable row level security;

-- 2) Eski/yinelenen sürümleri temizle
drop policy if exists "products_public_read_active" on public.products;
drop policy if exists "products_owner_select"       on public.products;
drop policy if exists "products_owner_insert"       on public.products;
drop policy if exists "products_owner_update"       on public.products;
drop policy if exists "products_owner_delete"       on public.products;

-- 3) VİTRİN: herkes yalnızca AKTİF mağazaların YAYINDAKİ ürünlerini okuyabilir.
--    Taslak (pending) ürünler ve pasif mağazaların ürünleri anon'a kapalıdır.
create policy "products_public_read_active"
  on public.products for select
  using (
    status = 'active'
    and exists (
      select 1 from public.stores s
       where s.id = products.store_id
         and s.status = 'active'
    )
  );

-- 4) SAHİP: kullanıcı yalnızca KENDİ mağazasına ait ürünleri yönetebilir.
--    Sahiplik products.user_id yerine mağaza üzerinden doğrulanır — böylece
--    user_id'si boş kalmış eski kayıtlar da güvenle kapsanır ve kötü niyetli
--    bir kullanıcı başkasının store_id'siyle ürün ekleyemez/değiştiremez.

create policy "products_owner_select"
  on public.products for select
  using (
    exists (
      select 1 from public.stores s
       where s.id = products.store_id
         and s.user_id = auth.uid()
    )
  );

create policy "products_owner_insert"
  on public.products for insert
  with check (
    exists (
      select 1 from public.stores s
       where s.id = products.store_id
         and s.user_id = auth.uid()
    )
  );

create policy "products_owner_update"
  on public.products for update
  using (
    exists (
      select 1 from public.stores s
       where s.id = products.store_id
         and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.stores s
       where s.id = products.store_id
         and s.user_id = auth.uid()
    )
  );

create policy "products_owner_delete"
  on public.products for delete
  using (
    exists (
      select 1 from public.stores s
       where s.id = products.store_id
         and s.user_id = auth.uid()
    )
  );

-- ── Doğrulama (çalıştırdıktan sonra kontrol edin) ───────────────────────────
-- select policyname, cmd from pg_policies where tablename = 'products';
-- Beklenen: 5 satır (public_read_active/select + owner select/insert/update/delete)
