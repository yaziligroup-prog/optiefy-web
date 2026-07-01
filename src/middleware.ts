import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Ana platform alan adları — bu hostname'lerde panel + landing çalışır
const SAAS_HOSTNAMES = [
  "localhost",
  "optiefy.com",
  "www.optiefy.com",
];

// Optiefy ücretsiz subdomain suffix'i
const FREE_SUBDOMAIN_SUFFIX = ".optiefy.com";

export async function middleware(request: NextRequest) {
  const host     = request.headers.get("host") ?? "";
  const hostname = host.split(":")[0];
  const pathname = request.nextUrl.pathname;

  // ── 1a. Wildcard subdomain: *.optiefy.com → mağaza vitrini ───────────────
  // Örn: papatyadunyam.optiefy.com → /store/papatyadunyam.optiefy.com
  // DB'de custom_domain kolonu "papatyadunyam.optiefy.com" olarak saklanır
  if (
    hostname.endsWith(FREE_SUBDOMAIN_SUFFIX) &&
    !SAAS_HOSTNAMES.includes(hostname)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = `/store/${hostname}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // ── 1b. Tam custom domain: kendi alan adı ile mağaza ─────────────────────
  // Örn: vivinth.com → /store/vivinth.com
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
