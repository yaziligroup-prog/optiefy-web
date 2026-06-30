import { NextRequest, NextResponse } from "next/server";

// Bizim SaaS domain'lerimiz — bu listedekiler normal routinge gider
const SAAS_HOSTNAMES = [
  "localhost",
  "yarolify.com",
  "www.yarolify.com",
];

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const hostname = host.split(":")[0]; // port numarasını temizle

  // Ana SaaS domain'i veya Vercel preview URL'si → normal routing
  if (
    SAAS_HOSTNAMES.includes(hostname) ||
    hostname.endsWith(".vercel.app") ||
    hostname.endsWith(".localhost")
  ) {
    return NextResponse.next();
  }

  // Custom domain → sessizce /store/[domain] rotasına yönlendir
  // Tarayıcıdaki URL değişmez (rewrite, redirect değil)
  const url = req.nextUrl.clone();
  url.pathname = `/store/${hostname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // _next, api ve statik dosyaları es geç
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|api/).*)",
  ],
};
