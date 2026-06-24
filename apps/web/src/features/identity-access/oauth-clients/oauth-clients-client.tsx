"use client";

import { Filter, Search } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { ErrorState } from "@/components/error-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { apiErrorMessage } from "@/features/identity-access/components/identity-api-error";
import {
  deleteOAuthClient,
  rotateOAuthClientSecret,
  updateOAuthClient,
} from "./api";
import { OAuthClientsTable } from "./oauth-clients-table";
import { OneTimeSecretPanel } from "./one-time-secret-panel";
import type {
  IdentityOAuthClient,
  OAuthClientStatus,
  OneTimeOAuthSecret,
} from "./types";
import { oauthClientId } from "./oauth-client-utils";

const statusLabels: Record<OAuthClientStatus, string> = {
  active: "Activo",
  deleted: "Eliminado",
  suspended: "Suspendido",
};

export function OAuthClientsClient({
  initialError,
  clients,
  locale,
}: {
  initialError?: string | null;
  clients: IdentityOAuthClient[];
  locale: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OAuthClientStatus | "">("");
  const [actionError, setActionError] = useState<string | null>(initialError ?? null);
  const [pendingClientId, setPendingClientId] = useState<string | null>(null);
  const [secret, setSecret] = useState<OneTimeOAuthSecret | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredClients = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return clients.filter((client) => {
      const matchesStatus = status ? client.status === status : true;
      const matchesSearch = normalizedSearch
        ? [client.clientId, client.audience].some((value) =>
            String(value ?? "")
              .toLowerCase()
              .includes(normalizedSearch)
          )
        : true;

      return matchesStatus && matchesSearch;
    });
  }, [clients, search, status]);

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function runAction(client: IdentityOAuthClient, action: () => Promise<unknown>) {
    const id = oauthClientId(client);
    setPendingClientId(id);
    setActionError(null);

    try {
      await action();
      refresh();
    } catch (error) {
      setActionError(apiErrorMessage(error));
    } finally {
      setPendingClientId(null);
    }
  }

  async function handleRotateSecret(client: IdentityOAuthClient) {
    await runAction(client, async () => {
      const response = await rotateOAuthClientSecret(oauthClientId(client));
      if (response.clientSecret) {
        setSecret({
          clientId: response.clientId ?? client.clientId,
          clientSecret: response.clientSecret,
          title: "Secreto rotado",
        });
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_14rem]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-12 bg-card pl-10"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por client ID o audience"
              value={search}
            />
          </label>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex h-12 w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium outline-none transition-all hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
              disabled={isPending}
              type="button"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Filter className="size-4 text-muted-foreground" />
                <span className="truncate">{status ? statusLabels[status] : "Todos los estados"}</span>
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuRadioGroup
                onValueChange={(value) => setStatus(value as OAuthClientStatus | "")}
                value={status}
              >
                <DropdownMenuRadioItem className="min-h-12 cursor-pointer px-2" value="">
                  Todos los estados
                </DropdownMenuRadioItem>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <DropdownMenuRadioItem
                    className="min-h-12 cursor-pointer px-2"
                    key={value}
                    value={value}
                  >
                    {label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {secret ? <OneTimeSecretPanel onDismiss={() => setSecret(null)} secret={secret} /> : null}

      {actionError ? (
        <ErrorState
          actionLabel="Reintentar"
          error={new Error(actionError)}
          onRetry={refresh}
          title="No se pudo cargar OAuth clients"
        />
      ) : null}

      {!actionError ? (
        <OAuthClientsTable
          clients={filteredClients}
          locale={locale}
          onDelete={(client) => runAction(client, () => deleteOAuthClient(oauthClientId(client)))}
          onRotateSecret={handleRotateSecret}
          onStatus={(client, nextStatus) =>
            runAction(client, () => updateOAuthClient(oauthClientId(client), { status: nextStatus }))
          }
          pendingClientId={pendingClientId}
        />
      ) : null}
    </div>
  );
}
