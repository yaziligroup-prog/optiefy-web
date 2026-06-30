-- ════════════════════════════════════════════════════════════════════════════
--  Yarolify — Sipariş Şeması (orders & order_items)
--  Supabase SQL Editor'da bir kez çalıştırın.
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ─── orders ───────────────────────────────────────────────────────────────────
create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  order_number     text unique not null,
  store_id         uuid references public.stores(id) on delete set null,

  -- Müşteri / teslimat bilgileri
  customer_name    text not null,
  customer_email   text not null,
  customer_phone   text not null,
  shipping_address text not null,
  city             text not null,
  postal_code      text,

  -- Tutarlar & lojistik (hacimsel/desi)
  subtotal         numeric(10,2) not null default 0,
  shipping_cost    numeric(10,2) not null default 0,
  total            numeric(10,2) not null default 0,
  total_desi       numeric(10,2) not null default 0,
  is_oversized     boolean       not null default false,

  -- Durumlar
  status           text not null default 'preparing',  -- pending | preparing | shipped | delivered | cancelled
  payment_status   text not null default 'paid'        -- paid | pending | failed (mock ödeme)
);

-- ─── order_items ──────────────────────────────────────────────────────────────
create table if not exists public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  product_id   uuid references public.stores(id) on delete set null,
  product_name text not null,
  unit_price   numeric(10,2) not null default 0,
  quantity     int not null default 1,
  image        text,
  line_total   numeric(10,2) not null default 0
);

create index if not exists orders_created_at_idx   on public.orders (created_at desc);
create index if not exists order_items_order_id_idx on public.order_items (order_id);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
-- Demo politikası: vitrin (anon) sipariş oluşturabilir, panel siparişleri okuyabilir.
-- ÜRETİMDE: select/update'i auth.uid() = store sahibi olacak şekilde kısıtlayın.
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "orders_insert_public"      on public.orders;
drop policy if exists "orders_select_public"      on public.orders;
drop policy if exists "order_items_insert_public" on public.order_items;
drop policy if exists "order_items_select_public" on public.order_items;

create policy "orders_insert_public"      on public.orders      for insert to anon, authenticated with check (true);
create policy "orders_select_public"      on public.orders      for select to anon, authenticated using (true);
create policy "order_items_insert_public" on public.order_items for insert to anon, authenticated with check (true);
create policy "order_items_select_public" on public.order_items for select to anon, authenticated using (true);
