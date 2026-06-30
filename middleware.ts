import { NextRequest, NextResponse } from "next/server";

const SAAS_HOSTNAMES = [
  "localhost",
  "optiefy.com",
  "www.optiefy.com",
];

export function middleware(req: NextRequest) {
  const host     = req.headers.get("host") ?? "";
  const hostname = host.split(":")[0];
  const pathname = req.nextUrl.pathname;

  const isSaasDomain =
    SAAS_HOSTNAMES.includes(hostname) ||
    hostname.endsWith(".vercel.app") ||
    hostname.endsWith(".localhost");

  if (isSaasDomain) {
    return NextResponse.next();
  }

  // www.domain.com → domain.com normalise (DB her zaman apex domain saklar)
  const apex = hostname.startsWith("www.") ? hostname.slice(4) : hostname;

  // Custom mağaza domain'i → vitrin sayfasına sessiz rewrite
  const url = req.nextUrl.clone();
  url.pathname = `/store/${apex}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|api/).*)" ],
};
