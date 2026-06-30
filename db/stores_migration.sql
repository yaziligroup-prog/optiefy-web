-- ════════════════════════════════════════════════════════════════════════════
--  Yarolify — Stores Migrasyonu
--  Supabase SQL Editor'da bir kez çalıştırın.
-- ════════════════════════════════════════════════════════════════════════════

-- ─── 1. Eksik sütunları ekle ──────────────────────────────────────────────────
alter table public.stores add column if not exists currency     text        default 'TRY';
alter table public.stores add column if not exists user_id      uuid        references auth.users(id);
alter table public.stores add column if not exists image_urls   text[];
alter table public.stores add column if not exists theme        text        default 'modern';
alter table public.stores add column if not exists custom_domain text;
alter table public.stores add column if not exists seo_title    text;
alter table public.stores add column if not exists description  text;
alter table public.stores add column if not exists features     text[];
alter table public.stores add column if not exists status       text        default 'active';

-- ─── 2. Stores RLS ───────────────────────────────────────────────────────────
alter table public.stores enable row level security;

drop policy if exists "stores_select_public"    on public.stores;
drop policy if exists "stores_insert_owner"     on public.stores;
drop policy if exists "stores_update_owner"     on public.stores;
drop policy if exists "stores_delete_owner"     on public.stores;
drop policy if exists "own_stores"              on public.stores;

-- Vitrin (domain bazlı) herkese açık — müşteriler mağaza sayfasını görebilir
create policy "stores_select_public" on public.stores
  for select using (status = 'active' or auth.uid() = user_id);

-- Sadece oturum sahibi mağaza oluşturabilir
create policy "stores_insert_owner" on public.stores
  for insert to authenticated with check (auth.uid() = user_id);

-- Sadece mağaza sahibi güncelleyebilir
create policy "stores_update_owner" on public.stores
  for update to authenticated using (auth.uid() = user_id);

-- Sadece mağaza sahibi silebilir
create policy "stores_delete_owner" on public.stores
  for delete to authenticated using (auth.uid() = user_id);

-- ─── 3. Products RLS ─────────────────────────────────────────────────────────
alter table public.products enable row level security;

drop policy if exists "products_select_public"  on public.products;
drop policy if exists "products_insert_owner"   on public.products;
drop policy if exists "products_update_owner"   on public.products;
drop policy if exists "own_products"            on public.products;

create policy "products_select_public" on public.products
  for select using (true);

create policy "products_insert_owner" on public.products
  for insert to authenticated with check (auth.uid() = user_id);

create policy "products_update_owner" on public.products
  for update to authenticated using (auth.uid() = user_id);

-- ─── 4. Orders RLS (güvenli — sadece mağaza sahibi kendi siparişlerini görür) ───
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "orders_insert_public"        on public.orders;
drop policy if exists "orders_select_public"        on public.orders;
drop policy if exists "orders_insert_anon"          on public.orders;
drop policy if exists "orders_select_owner"         on public.orders;
drop policy if exists "orders_update_owner"         on public.orders;
drop policy if exists "order_items_insert_public"   on public.order_items;
drop policy if exists "order_items_select_public"   on public.order_items;
drop policy if exists "order_items_insert_anon"     on public.order_items;
drop policy if exists "order_items_select_owner"    on public.order_items;

-- Müşteriler (anon) sipariş oluşturabilir
create policy "orders_insert_anon" on public.orders
  for insert to anon, authenticated with check (true);

-- Sadece ilgili mağaza sahibi kendi siparişlerini görebilir
create policy "orders_select_owner" on public.orders
  for select to authenticated
  using (
    store_id in (
      select id from public.stores where user_id = auth.uid()
    )
  );

-- Mağaza sahibi sipariş durumunu güncelleyebilir (kargo takip vb.)
create policy "orders_update_owner" on public.orders
  for update to authenticated
  using (
    store_id in (
      select id from public.stores where user_id = auth.uid()
    )
  );

-- Müşteriler sepet kalemlerini ekleyebilir
create policy "order_items_insert_anon" on public.order_items
  for insert to anon, authenticated with check (true);

-- Sadece mağaza sahibi kendi sipariş kalemlerini görebilir
create policy "order_items_select_owner" on public.order_items
  for select to authenticated
  using (
    order_id in (
      select o.id from public.orders o
      join public.stores s on s.id = o.store_id
      where s.user_id = auth.uid()
    )
  );

-- ─── 5. Orders tracking number ────────────────────────────────────────────────
alter table public.orders add column if not exists tracking_number text;

-- ─── 6. Kargo ayarları ────────────────────────────────────────────────────────
alter table public.stores add column if not exists shipping_fee            numeric default 0;
alter table public.stores add column if not exists free_shipping_threshold numeric;
