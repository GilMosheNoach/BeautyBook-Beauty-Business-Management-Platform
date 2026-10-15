import { NextResponse, type NextRequest } from "next/server";
import { appUrl, businessUrl, rootDomain, slugFromHost } from "@/lib/url";

// Owner screens live on the main app host only (the session cookie is per host).
const APP_ONLY = /^\/(dashboard|login|signup|onboarding|subscribe)(\/|$)/;
const BUSINESS_PATH = /^\/b\/([a-z0-9]+(?:-[a-z0-9]+)*)(\/.*)?$/;
// Shared routes that keep their own path on a subdomain; every other path belongs to the business page.
const SHARED = /^\/(b|beauticians)(\/|$)/;

/**
 * Each business answers on its own subdomain: <slug>.<root domain>/<path> shows /b/<slug>/<path>
 * (the page itself, /a/<token> for a client's appointment, and so on).
 * Once a root domain is configured, /b/<slug> on the main host redirects there,
 * so Google sees one address per business.
 */
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const host = req.headers.get("host");
  const slug = slugFromHost(host);
  const isRead = req.method === "GET" || req.method === "HEAD";

  if (slug) {
    const own = pathname.match(BUSINESS_PATH);
    if (isRead && own && own[1] === slug) return NextResponse.redirect(businessUrl(slug, (own[2] || "/") + search), 308);
    if (APP_ONLY.test(pathname)) return isRead ? NextResponse.redirect(appUrl(pathname + search), 308) : NextResponse.next();
    if (SHARED.test(pathname)) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = `/b/${slug}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  const match = rootDomain() && isRead ? pathname.match(BUSINESS_PATH) : null;
  if (match) return NextResponse.redirect(businessUrl(match[1], (match[2] || "") + search), 308);
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|__nextjs|api/|img/|icon|favicon|robots.txt|sitemap.xml).*)"],
};
