import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Platform alan adları — bunlar dışındaki her hostname custom mağaza domainiydi
const SAAS_HOSTNAMES = [
  "localhost",
  "optiefy.com",
  "www.optiefy.com",
];

export async function middleware(request: NextRequest) {
  const host     = request.headers.get("host") ?? "";
  const hostname = host.split(":")[0];
  const pathname = request.nextUrl.pathname;

  // ── 1. Custom domain routing ──────────────────────────────────────────────
  // optiefy.com / localhost / *.vercel.app / *.localhost dışındaki her istek
  // → maskelenmiş mağaza vitrini olarak render et (adres çubuğu değişmez)
  const isSaasDomain =
    SAAS_HOSTNAMES.includes(hostname) ||
    hostname.endsWith(".vercel.app") ||
    hostname.endsWith(".localhost");

  if (!isSaasDomain) {
    // www.vivinth.com → vivinth.com  (DB her zaman apex domain saklar)
    const apex = hostname.startsWith("www.") ? hostname.slice(4) : hostname;
    const url  = request.nextUrl.clone();
    url.pathname = `/store/${apex}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // ── 2. Platform domain — sadece /panel/* için auth guard ─────────────────
  if (!pathname.startsWith("/panel")) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  // _next statics, favicon ve api hariç tüm path'ler
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|api/).*)" ],
};
