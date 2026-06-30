-- ─── PayTR Marketplace Migrasyonu ───────────────────────────────────────────────
-- Supabase SQL Editor'da bir kez çalıştırın.

-- stores: alt satıcı bilgileri
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS paytr_sub_merchant_id   text,
  ADD COLUMN IF NOT EXISTS paytr_sub_merchant_key   text,
  ADD COLUMN IF NOT EXISTS paytr_sub_merchant_salt  text;

-- payment_transactions: her ödeme girişimini izler
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        timestamptz DEFAULT now(),
  order_id          uuid        REFERENCES public.orders(id) ON DELETE CASCADE,
  merchant_oid      text        NOT NULL UNIQUE, -- = orders.order_number
  amount_kurus      integer     NOT NULL,        -- PayTR kuruş cinsinden
  status            text        NOT NULL DEFAULT 'pending', -- pending | success | failed
  payment_type      text,        -- card | eft
  installment_count integer     DEFAULT 0,
  currency          text        DEFAULT 'TL',
  raw_callback      jsonb,
  updated_at        timestamptz DEFAULT now()
);

-- RLS: payment_transactions
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pt_owner_select" ON public.payment_transactions;
DROP POLICY IF EXISTS "pt_insert_anon"  ON public.payment_transactions;
DROP POLICY IF EXISTS "owner_select"    ON public.payment_transactions;

-- Sadece ilgili mağaza sahibi kendi işlem kayıtlarını görebilir
CREATE POLICY "pt_owner_select" ON public.payment_transactions
  FOR SELECT TO authenticated USING (
    order_id IN (
      SELECT o.id FROM public.orders o
      JOIN public.stores s ON s.id = o.store_id
      WHERE s.user_id = auth.uid()
    )
  );

-- Ödeme başlatma (token route) anon ile pending kayıt oluşturabilir.
-- NOT: Durum güncellemeleri (success/failed) yalnızca callback'te SERVICE ROLE
-- ile yapılır; bu yüzden anon için UPDATE politikası bilinçli olarak yoktur.
CREATE POLICY "pt_insert_anon" ON public.payment_transactions
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Sütun yorumları
COMMENT ON COLUMN public.stores.paytr_sub_merchant_id   IS 'PayTR Pazaryeri: alt satıcı ID';
COMMENT ON COLUMN public.stores.paytr_sub_merchant_key  IS 'PayTR Pazaryeri: alt satıcı API anahtarı';
COMMENT ON COLUMN public.stores.paytr_sub_merchant_salt IS 'PayTR Pazaryeri: alt satıcı salt';
