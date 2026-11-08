import { NextResponse, type NextRequest } from "next/server";
import { PRODUCTS } from "./content/opera";

// with cacheComponents, an unknown [slug] streams the PPR shell as 200 before
// notFound() runs, so unknown cases answer 404 at the edge instead
const slugs = new Set(PRODUCTS.map((product) => product.id));

export function proxy(request: NextRequest) {
  const match = /^\/projects\/([^/]+)\/?$/.exec(request.nextUrl.pathname);
  if (!match) return NextResponse.next();
  let slug = match[1];
  try {
    slug = decodeURIComponent(slug);
  } catch {
    return NextResponse.next(); // malformed escape: let the route answer
  }
  if (slugs.has(slug)) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = "/_not-found";
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: "/projects/:path*",
};
