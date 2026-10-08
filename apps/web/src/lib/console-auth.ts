export const SESSION_FAILURE_EVENT = "console:session-failure";
export const SESSION_COOKIE_NAME =
  process.env.NEXT_PUBLIC_SSO_COOKIE_NAME ?? "console_session";

export function getConsoleApiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_CONSOLE_API_BASE_URL?.replace(/\/+$/, "") ??
    "http://localhost:3016"
  );
}

export function safeReturnTo(path: string): string {
  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    /[\\\x00-\x1f]/.test(path)
  )
    return "/";
  const url = new URL(path, "http://console.local");
  return url.origin === "http://console.local"
    ? `${url.pathname}${url.search}`
    : "/";
}

export function consoleLoginUrl(path: string) {
  const url = new URL("/auth/login", getConsoleApiBaseUrl());
  url.searchParams.set("returnTo", safeReturnTo(path));
  return url.toString();
}

export function normalizeAuthError(reason: string | null | undefined) {
  return reason === "access_denied" || reason === "access_unavailable"
    ? reason
    : "auth_failed";
}

export function notifySessionFailure(status: number) {
  if (typeof window === "undefined" || ![401, 403, 503].includes(status))
    return;
  window.dispatchEvent(
    new CustomEvent(SESSION_FAILURE_EVENT, { detail: status })
  );
  if (status === 401) {
    window.location.assign(
      consoleLoginUrl(window.location.pathname + window.location.search)
    );
  }
}
