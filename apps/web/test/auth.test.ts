import { afterEach, describe, expect, test } from "bun:test";
import {
  consoleLoginUrl,
  normalizeAuthError,
  safeReturnTo,
  SESSION_FAILURE_EVENT,
} from "../src/lib/console-auth";
import { consoleApi, ConsoleApiError } from "../src/lib/console-api";
import {
  getConsoleSession,
  logoutConsole,
} from "../src/features/auth/console-session";
import { proxy } from "../src/proxy";
import { NextRequest } from "next/server";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import UsersPage from "../src/app/[lang]/(private)/identity/users/page";
import OrganizationDetailPage from "../src/app/[lang]/(private)/access/organizations/[organizationId]/page";
import { ConsoleSessionProvider } from "../src/features/auth/console-session-provider";

const originalFetch = globalThis.fetch;
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
function browser() {
  const redirects: string[] = [];
  const events: number[] = [];
  const target = Object.assign(new EventTarget(), {
    location: {
      pathname: "/es/identity/users",
      search: "?search=ana",
      assign: (url: string) => redirects.push(url),
    },
  });
  target.addEventListener(SESSION_FAILURE_EVENT, (event) =>
    events.push((event as CustomEvent<number>).detail)
  );
  Object.defineProperty(globalThis, "window", {
    value: target,
    configurable: true,
  });
  return { redirects, events };
}
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalWindow)
    Object.defineProperty(globalThis, "window", originalWindow);
  else Reflect.deleteProperty(globalThis, "window");
});

describe("Console session boundary", () => {
  test("server pages prepare no private requests before client session validation", async () => {
    let privateCalls = 0;
    globalThis.fetch = (async () => {
      privateCalls++;
      return Response.json({});
    }) as unknown as typeof fetch;
    const pages = await Promise.all([
      UsersPage({
        params: Promise.resolve({ lang: "es" }),
        searchParams: Promise.resolve({ search: "ana" }),
      }),
      OrganizationDetailPage({
        params: Promise.resolve({ lang: "es", organizationId: "organization" }),
      }),
    ]);
    for (const page of pages) {
      expect(
        renderToString(createElement(ConsoleSessionProvider, null, page))
      ).toContain("Validando sesión");
    }
    expect(privateCalls).toBe(0);
  });

  test("initial render does not expose or mount private children", () => {
    let rendered = false;
    const Private = () => {
      rendered = true;
      return createElement("p", null, "private");
    };
    const html = renderToString(
      createElement(ConsoleSessionProvider, null, createElement(Private))
    );
    expect(rendered).toBe(false);
    expect(html).toContain("Validando sesión");
  });

  test("fetches session with credentials and discards non-public fields", async () => {
    let options: RequestInit | undefined;
    globalThis.fetch = (async (_url: RequestInfo | URL, init?: RequestInit) => {
      options = init;
      return Response.json({
        authenticated: true,
        user: {
          sub: "user",
          iss: "issuer",
          email: "admin@test",
          name: "Admin",
          accessToken: "secret",
        },
        refreshToken: "secret",
      });
    }) as unknown as typeof fetch;
    expect(await getConsoleSession()).toEqual({
      authenticated: true,
      user: { sub: "user", iss: "issuer", email: "admin@test", name: "Admin" },
    });
    expect(options?.credentials).toBe("include");
  });

  test.each([401, 403, 503, 429])("retains HTTP status %s", async (status) => {
    globalThis.fetch = (async () =>
      Response.json(
        { message: "Unavailable" },
        { status }
      )) as unknown as typeof fetch;
    try {
      await consoleApi.get("/auth/session");
      throw new Error("Expected rejection");
    } catch (error) {
      expect(error).toBeInstanceOf(ConsoleApiError);
      expect((error as ConsoleApiError).status).toBe(status);
    }
  });

  test("rejects invalid session data", async () => {
    globalThis.fetch = (async () =>
      Response.json({
        authenticated: true,
        user: {},
      })) as unknown as typeof fetch;
    await expect(getConsoleSession()).rejects.toMatchObject({ status: 503 });
  });

  test("does not send browser Bearer credentials", async () => {
    let sent: Headers | undefined;
    globalThis.fetch = (async (_url: RequestInfo | URL, init?: RequestInit) => {
      sent = new Headers(init?.headers);
      return Response.json({});
    }) as unknown as typeof fetch;
    await consoleApi.get("/me", {
      headers: { Authorization: "Bearer must-not-send" },
    });
    expect(sent?.get("Authorization")).toBeNull();
  });

  test.each(["//evil.test", "/\\evil.test", "https://evil.test", "/\npath"])(
    "rejects unsafe return path %s",
    (path) => {
      expect(safeReturnTo(path)).toBe("/");
    }
  );

  test("login preserves locale, path and query", () => {
    expect(
      new URL(
        consoleLoginUrl("/es/identity/users?search=ana")
      ).searchParams.get("returnTo")
    ).toBe("/es/identity/users?search=ana");
  });

  test.each(["auth_failed", "access_denied", "access_unavailable"])(
    "normalizes callback error %s to a public route",
    (error) => {
      const result = proxy(
        new NextRequest(`http://console.test/es?error=${error}`)
      );
      expect(result.headers.get("location")).toBe(
        `http://console.test/es/auth/error?error=${error}`
      );
      const publicResult = proxy(
        new NextRequest(`http://console.test/es/auth/error?error=${error}`)
      );
      expect(publicResult.headers.get("location")).toBeNull();
    }
  );

  test("unknown callback errors become auth_failed", () =>
    expect(normalizeAuthError("private-error")).toBe("auth_failed"));
  test("uses Spanish regardless of browser language and saved preference", () => {
    const result = proxy(new NextRequest("http://console.test/identity/users?q=1", {
      headers: { "Accept-Language": "en-US,en;q=0.9", Cookie: "NEXT_LOCALE=en" },
    }));
    expect(result.headers.get("location")).toBe("http://console.test/es/identity/users?q=1");
  });

  test("proxy only prechecks cookie and redirects missing session to login", () => {
    const result = proxy(
      new NextRequest("http://console.test/es/identity/users?q=1")
    );
    expect(
      new URL(result.headers.get("location")!).searchParams.get("returnTo")
    ).toBe("/es/identity/users?q=1");
    const withCookie = proxy(
      new NextRequest("http://console.test/es/identity/users", {
        headers: { Cookie: "console_session=opaque" },
      })
    );
    expect(withCookie.headers.get("location")).toBeNull();
  });
});

describe("Browser session failures and logout", () => {
  test.each([401, 403, 503])(
    "invalidates session centrally on HTTP %s",
    async (status) => {
      const { redirects, events } = browser();
      globalThis.fetch = (async () =>
        Response.json(
          { message: "Unavailable" },
          { status }
        )) as unknown as typeof fetch;
      await expect(
        consoleApi.get("/identity-access/users")
      ).rejects.toMatchObject({ status });
      expect(events).toEqual([status]);
      expect(redirects).toHaveLength(status === 401 ? 1 : 0);
      if (status === 401)
        expect(new URL(redirects[0]).searchParams.get("returnTo")).toBe(
          "/es/identity/users?search=ana"
        );
    }
  );

  test("an invalid JSON body still invalidates and redirects a 401 session", async () => {
    const { redirects, events } = browser();
    globalThis.fetch = (async () =>
      new Response("{", {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })) as unknown as typeof fetch;
    await expect(consoleApi.get("/me")).rejects.toMatchObject({ status: 401 });
    expect(events).toEqual([401]);
    expect(redirects).toHaveLength(1);
  });

  test("logout closes Console and Identity with credentials before returning to the locale", async () => {
    const { redirects } = browser();
    const calls: { url: string; method?: string; credentials?: string }[] = [];
    globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
      calls.push({
        url: String(url),
        method: init?.method,
        credentials: init?.credentials,
      });
      return calls.length === 1
        ? Response.json({ logoutUrl: "http://identity.test/oauth/logout" })
        : new Response(null, { status: 204 });
    }) as unknown as typeof fetch;
    await logoutConsole("es");
    expect(calls).toEqual([
      {
        url: "http://localhost:3016/auth/logout",
        method: "POST",
        credentials: "include",
      },
      {
        url: "http://identity.test/oauth/logout",
        method: "POST",
        credentials: "include",
      },
    ]);
    expect(redirects).toEqual(["/es"]);
  });
});
