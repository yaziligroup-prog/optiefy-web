import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

// Ana SaaS domain'leri — bu host'lardan gelen istekler normal Next.js routing'e gider
const SAAS_HOSTNAMES = [
  "localhost",
  "optiefy.com",
  "www.optiefy.com",
];

export async function middleware(req: NextRequest) {
  const host      = req.headers.get("host") ?? "";
  const hostname  = host.split(":")[0];
  const pathname  = req.nextUrl.pathname;

  // ── 1. Custom domain → /store/[domain] rewrite ──────────────────────────────
  // Vercel preview URL'leri ve SaaS domain'leri normal routing'e geçer;
  // diğer tüm host'lar (mağaza custom domain'leri) vitrin sayfasına yönlendirilir.
  const isSaasDomain =
    SAAS_HOSTNAMES.includes(hostname) ||
    hostname.endsWith(".vercel.app") ||
    hostname.endsWith(".localhost");

  if (!isSaasDomain) {
    const url = req.nextUrl.clone();
    url.pathname = `/store/${hostname}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // ── 2. Panel auth koruması ───────────────────────────────────────────────────
  if (pathname.startsWith("/panel")) {
    let response = NextResponse.next({ request: req });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
            response = NextResponse.next({ request: req });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|api/).*)" ],
};
