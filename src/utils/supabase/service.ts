import { createClient } from "@supabase/supabase-js";

// Service role client — sadece server-side, asla client'a gönderilmez.
// Kullanım: satıcı e-postasını auth.users'dan çekmek gibi RLS bypass gerektiren işlemler.
export function createServiceClient() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null; // henüz konfigüre edilmemişse null dön
  return createClient(url, key, { auth: { persistSession: false } });
}
