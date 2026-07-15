import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale, locales } from "@/i18n/config";

const LOCALE_COOKIE = "NEXT_LOCALE";
const SESSION_COOKIE = "console_session"; // set by Console API /auth/callback (sso.config.ts)
const DEFAULT_BACKEND_URL = "http://localhost:3016";

// ponytail: naive Accept-Language parse + cookie preference; swap for negotiator/intl-localematcher if q-value ranking matters.
function pickLocale(req: NextRequest) {
  const fromCookie = req.cookies.get(LOCALE_COOKIE)?.value;
  if (fromCookie && isLocale(fromCookie)) return fromCookie;

  const tags = (req.headers.get("accept-language") ?? "")
    .split(",")
    .map((part) => part.split(";")[0].trim().split("-")[0]);
  return tags.find(isLocale) ?? defaultLocale;
}

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // 1. No locale in the path -> redirect to the resolved one.
  const hasLocale = locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (!hasLocale) {
    const url = req.nextUrl.clone();
    url.pathname = `/${pickLocale(req)}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  // 2. SSO gate: no session -> backend login. It redirects back here after /auth/callback.
  if (!req.cookies.get(SESSION_COOKIE)?.value) {
    if (req.nextUrl.searchParams.get("error") === "auth_failed") {
      return NextResponse.next();
    }

    const backend = process.env.NEXT_PUBLIC_CONSOLE_API_BASE_URL ?? DEFAULT_BACKEND_URL;
    const loginUrl = new URL("/auth/login", backend);
    loginUrl.searchParams.set("returnTo", `${pathname}${search}`); // same-origin path, starts with "/"
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
