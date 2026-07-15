import Link from "next/link";
import { headers } from "next/headers";
import {
  Activity,
  ExternalLink,
  KeyRound,
  LogIn,
  Plus,
  ShieldAlert,
  Server,
  UserPlus,
  Users,
} from "lucide-react";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge, type StatusBadgeTone } from "@/components/status-badge";
import { consoleApi } from "@/lib/console-api";
import { getDictionary } from "@/i18n/dictionaries";
import { breadcrumbsFor, localizedHref } from "@/lib/nav";
import type { Locale } from "@/i18n/config";

type QueryResult<T> =
  | { data: T; error: null; ok: true }
  | { data: null; error: Error; ok: false };

type HemiaIdHealth = {
  live?: unknown;
  ready?: unknown;
  status?: string;
  startup?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function safeQuery<T>(request: () => Promise<T>): Promise<QueryResult<T>> {
  try {
    return { data: await request(), error: null, ok: true };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown dashboard error"),
      ok: false,
    };
  }
}

async function dashboardHeaders() {
  const cookie = (await headers()).get("cookie");
  return cookie ? { Cookie: cookie } : undefined;
}

function countFromPayload(payload: unknown) {
  if (Array.isArray(payload)) return payload.length;
  if (!isRecord(payload)) return null;
  if (typeof payload.total === "number") return payload.total;
  if (Array.isArray(payload.data)) return payload.data.length;
  if (Array.isArray(payload.items)) return payload.items.length;
  return null;
}

function firstString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) return value;
  }

  return null;
}

function activeAccountLabel(payload: unknown, fallback: string) {
  if (!isRecord(payload)) return fallback;

  const account = isRecord(payload.account) ? payload.account : payload;

  return (
    firstString(account, ["name", "displayName", "email", "tenantName", "organizationName", "id"]) ??
    fallback
  );
}

function valueOrError(result: QueryResult<unknown>, fallback: string, errorLabel: string) {
  if (!result.ok) return errorLabel;

  const count = countFromPayload(result.data);
  return count === null ? fallback : String(count);
}

function consoleStatus(results: QueryResult<unknown>[]) {
  return results.some((result) => result.ok) ? "connected" : "error";
}

function healthTone(result: QueryResult<HemiaIdHealth>): StatusBadgeTone {
  if (!result.ok) return "danger";
  return result.data.status === "degraded" ? "warning" : "success";
}

function loginUrl(lang: Locale) {
  const backend = process.env.NEXT_PUBLIC_CONSOLE_API_BASE_URL ?? "http://localhost:3016";
  const url = new URL("/auth/login", backend);
  url.searchParams.set("returnTo", `/${lang}`);
  return url.toString();
}

function AuthFailedScreen({ lang }: { lang: Locale }) {
  return (
    <div className="grid min-h-[calc(100vh-var(--layout-topbar-height)-3rem)] place-items-center">
      <section
        aria-labelledby="auth-error-title"
        className="w-full max-w-xl rounded-lg border border-border bg-card p-6 text-center shadow-sm"
      >
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-red-50 text-red-600">
          <ShieldAlert className="size-5" />
        </span>
        <h1 id="auth-error-title" className="mt-4 text-2xl font-bold text-foreground">
          No se pudo iniciar sesion
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Identity rechazo el acceso o la sesion expiro durante el callback. La consola detuvo el
          reintento automatico para evitar un ciclo de autenticacion.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            href={loginUrl(lang)}
          >
            <LogIn className="size-4" />
            Intentar de nuevo
          </a>
          <Link
            className="inline-flex h-12 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            href={`/${lang}`}
          >
            Volver al inicio
          </Link>
        </div>
      </section>
    </div>
  );
}

export default async function Home({
  params,
  searchParams,
}: {
  params: Promise<{ lang: Locale }>;
  searchParams?: Promise<{ error?: string }>;
}) {
  const { lang } = await params;
  const query = await searchParams;

  if (query?.error === "auth_failed") {
    return <AuthFailedScreen lang={lang} />;
  }

  const t = (await getDictionary(lang)).home;
  const requestHeaders = await dashboardHeaders();

  const quickLinks = [
    { href: "/identity-access/users", icon: UserPlus, label: t.quickLinks.createUser },
    { href: "/identity-access/accounts", icon: KeyRound, label: t.quickLinks.accounts },
    { href: "/identity-access/oauth-clients", icon: Plus, label: t.quickLinks.createOAuthClient },
  ];

  const [health, activeAccount, users, oauthClients] = await Promise.all([
    safeQuery(() =>
      consoleApi.get<HemiaIdHealth>("/identity-access/health/hemia-id", {
        headers: requestHeaders,
      })
    ),
    safeQuery(() =>
      consoleApi.get<unknown>("/identity-access/accounts/active", {
        headers: requestHeaders,
      })
    ),
    safeQuery(() =>
      consoleApi.get<unknown>("/identity-access/users", {
        headers: requestHeaders,
        query: { limit: 1 },
      })
    ),
    safeQuery(() =>
      consoleApi.get<unknown>("/identity-access/oauth-clients", {
        headers: requestHeaders,
        query: { limit: 1 },
      })
    ),
  ]);

  const apiStatus = consoleStatus([health, activeAccount, users, oauthClients]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={<AppBreadcrumb items={breadcrumbsFor("/", lang)} />}
        description="Resumen operativo de la consola"
        title="Dashboard"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t.cards.consoleApi}
          value={apiStatus === "connected" ? t.status.connected : t.status.error}
          icon={<Activity className="size-5" />}
        />
        <StatCard
          label={t.cards.hemiaId}
          value={
            health.ok
              ? health.data.status === "degraded"
                ? t.status.degraded
                : t.status.ok
              : t.status.error
          }
          tone={health.ok && health.data.status === "degraded" ? "violet" : "blue"}
          icon={<Server className="size-5" />}
        />
        <StatCard
          label={t.cards.activeAccount}
          value={activeAccount.ok ? activeAccountLabel(activeAccount.data, t.status.noActiveAccount) : t.status.error}
          tone="violet"
          icon={<KeyRound className="size-5" />}
        />
        <StatCard
          label={t.cards.users}
          value={valueOrError(users, t.status.unavailable, t.status.error)}
          icon={<Users className="size-5" />}
        />
        <StatCard
          label={t.cards.oauthClients}
          value={valueOrError(oauthClients, t.status.unavailable, t.status.error)}
          icon={<KeyRound className="size-5" />}
        />
      </div>

      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">{t.quickActionsTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t.quickActionsDescription}</p>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => (
            <Link
              className="inline-flex h-12 items-center gap-3 rounded-md border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              href={localizedHref(lang, link.href)}
              key={link.href}
            >
              <link.icon className="size-4 shrink-0" />
              <span className="truncate">{link.label}</span>
              <ExternalLink className="ml-auto size-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">{t.healthTitle}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t.healthDescription}</p>
          </div>
          <StatusBadge
            label={
              health.ok
                ? health.data.status === "degraded"
                  ? t.status.degraded
                  : t.status.ok
                : t.status.error
            }
            tone={healthTone(health)}
          />
        </div>
      </div>
    </div>
  );
}
