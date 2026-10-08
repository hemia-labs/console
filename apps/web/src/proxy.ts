import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale } from "@/i18n/config";
import {
  consoleLoginUrl,
  normalizeAuthError,
  SESSION_COOKIE_NAME,
} from "@/lib/console-auth";

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const locale = pathname.split("/")[1];
  if (!isLocale(locale)) {
    const url = req.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }
  const errorPath = `/${locale}/auth/error`;
  if (pathname === errorPath) return NextResponse.next();
  if (req.nextUrl.searchParams.has("error")) {
    const url = new URL(errorPath, req.url);
    url.searchParams.set(
      "error",
      normalizeAuthError(req.nextUrl.searchParams.get("error"))
    );
    return NextResponse.redirect(url);
  }
  if (!req.cookies.get(SESSION_COOKIE_NAME)?.value) {
    return NextResponse.redirect(consoleLoginUrl(`${pathname}${search}`));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!api|_next|.*\\..*).*)"] };
