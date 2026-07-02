/**
 * Supabase auth callback — OAuth ve e-posta doğrulama linkleri buraya döner.
 *
 * E-posta doğrulama akışı (signUp emailRedirectTo'da type=signup):
 *   code → oturuma çevrilir, kullanıcı `next` hedefine `verified=1` parametresiyle
 *   yönlendirilir; panel layout'taki listener başarı toast'ını gösterir.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type"); // "signup" → e-posta doğrulama
  let next = searchParams.get("next") ?? "/panel";
  if (!next.startsWith("/")) next = "/panel"; // open-redirect koruması

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const dest = new URL(next, origin);
      if (type === "signup") dest.searchParams.set("verified", "1");
      return NextResponse.redirect(dest);
    }
  }

  const errorCode = type === "signup" ? "verify_failed" : "auth_failed";
  return NextResponse.redirect(`${origin}/login?error=${errorCode}`);
}
