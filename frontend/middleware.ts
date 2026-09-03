import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = [
  "/cart",
  "/checkout",
  "/orders",
  "/dashboard",
  "/logistics",
];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtected) {
    const token = request.cookies.get("kalano_token");
    if (!token || !token.value) {
      const loginUrl = new URL("/login", request.url);
      const destination = `${pathname}${search}`;
      loginUrl.searchParams.set("redirect", destination);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/cart/:path*",
    "/checkout/:path*",
    "/orders/:path*",
    "/dashboard/:path*",
    "/logistics/:path*",
  ],
};
