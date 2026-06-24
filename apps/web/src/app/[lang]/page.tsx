import Link from "next/link";
import { headers } from "next/headers";
import {
  Activity,
  Building2,
  Clock,
  ExternalLink,
  KeyRound,
  Plus,
  Send,
  Server,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { EmptyState } from "@/components/empty-state";
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
  database?: unknown;
  hemiaId?: unknown;
  status?: string;
};

type AuditEvent = {
  action?: string;
  createdAt?: string;
  id?: string;
  resource?: string;
  status?: string;
};

type AuditResponse = {
  data?: AuditEvent[];
  limit?: number;
  page?: number;
  total?: number;
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

function auditTone(status?: string): StatusBadgeTone {
  if (status === "success") return "success";
  if (status === "failure") return "danger";
  return "muted";
}

function formatDate(value: string | undefined, locale: Locale) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(date);
}

export default async function Home({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  const t = (await getDictionary(lang)).home;
  const requestHeaders = await dashboardHeaders();

  const quickLinks = [
    { href: "/identity-access/users", icon: UserPlus, label: t.quickLinks.createUser },
    { href: "/identity-access/invitations", icon: Send, label: t.quickLinks.inviteUser },
    { href: "/identity-access/tenants", icon: Building2, label: t.quickLinks.createTenant },
    { href: "/identity-access/oauth-clients", icon: Plus, label: t.quickLinks.createOAuthClient },
  ];

  const [health, activeAccount, users, tenants, oauthClients, ssoClients, audit] = await Promise.all([
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
      consoleApi.get<unknown>("/identity-access/tenants", {
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
    safeQuery(() =>
      consoleApi.get<unknown>("/identity-access/sso-clients", {
        headers: requestHeaders,
        query: { limit: 1 },
      })
    ),
    safeQuery(() =>
      consoleApi.get<AuditResponse>("/identity-access/audit", {
        headers: requestHeaders,
        query: { limit: 5 },
      })
    ),
  ]);

  const apiStatus = consoleStatus([health, activeAccount, users, tenants, oauthClients, ssoClients, audit]);
  const auditEvents = audit.ok && Array.isArray(audit.data.data) ? audit.data.data : [];

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
          label={t.cards.tenants}
          value={valueOrError(tenants, t.status.unavailable, t.status.error)}
          icon={<Building2 className="size-5" />}
        />
        <StatCard
          label={t.cards.pendingInvitations}
          value={t.status.unavailable}
          tone="violet"
          icon={<Send className="size-5" />}
        />
        <StatCard
          label={t.cards.oauthClients}
          value={valueOrError(oauthClients, t.status.unavailable, t.status.error)}
          icon={<KeyRound className="size-5" />}
        />
        <StatCard
          label={t.cards.ssoClients}
          value={valueOrError(ssoClients, t.status.unavailable, t.status.error)}
          icon={<ShieldCheck className="size-5" />}
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

      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">{t.activityTitle}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t.activityDescription}</p>
          </div>
          <StatusBadge
            label={health.ok ? t.status.hemiaIdReachable : t.status.partialData}
            tone={healthTone(health)}
          />
        </div>
        {auditEvents.length > 0 ? (
          <div className="divide-y divide-border">
            {auditEvents.map((event, index) => (
              <div
                className="grid min-h-12 gap-3 px-5 py-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
                key={event.id ?? `${event.action}-${event.createdAt}-${index}`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{event.action ?? t.activityUnknownAction}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {event.resource ?? t.activityUnknownResource}
                  </p>
                </div>
                <StatusBadge
                  className="w-fit"
                  label={event.status ?? t.status.unknown}
                  tone={auditTone(event.status)}
                />
                <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  {formatDate(event.createdAt, lang)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-5">
            <EmptyState
              className="min-h-40 border-0 bg-transparent shadow-none"
              description={audit.ok ? t.activityEmptyDescription : t.activityUnavailableDescription}
              icon={<Clock className="size-5" />}
              title={audit.ok ? t.activityEmptyTitle : t.activityUnavailableTitle}
            />
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
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
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">{t.invitationsTitle}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t.invitationsDescription}</p>
            </div>
            <Link
              className="inline-flex h-12 shrink-0 items-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              href={localizedHref(lang, "/identity-access/invitations")}
            >
              <Send className="size-4" />
              <span className="hidden sm:inline">{t.quickLinks.inviteUser}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
