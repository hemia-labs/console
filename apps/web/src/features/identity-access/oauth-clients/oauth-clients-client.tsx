"use client";

import { Filter, RefreshCw } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/zuno/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/zuno/dropdown-menu";
import { SearchInput } from "@/components/zuno/search-input";
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
  onRefresh,
  clients,
  locale,
}: {
  initialError?: string | null;
  onRefresh: () => void;
  clients: IdentityOAuthClient[];
  locale: string;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OAuthClientStatus | "">("");
  const [actionError, setActionError] = useState<string | null>(
    initialError ?? null
  );
  const [pendingClientId, setPendingClientId] = useState<string | null>(null);
  const [secret, setSecret] = useState<OneTimeOAuthSecret | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredClients = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return clients.filter((client) => {
      const matchesStatus = status ? client.status === status : true;
      const matchesSearch = normalizedSearch
        ? [client.clientId, client.audience, ...(client.serviceDestinations ?? []).flatMap((destination) => [destination.audience, destination.resource, ...destination.scopes])].some((value) =>
            String(value ?? "")
              .toLowerCase()
              .includes(normalizedSearch)
          )
        : true;

      return matchesStatus && matchesSearch;
    });
  }, [clients, search, status]);

  function clearFilters() {
    setSearch("");
    setStatus("");
  }

  function refresh() {
    startTransition(() => {
      setActionError(null);
      onRefresh();
    });
  }

  async function runAction(
    client: IdentityOAuthClient,
    action: () => Promise<unknown>
  ) {
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
      {secret ? (
        <OneTimeSecretPanel onDismiss={() => setSecret(null)} secret={secret} />
      ) : null}

      <section aria-label="Clientes OAuth" className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 p-5 lg:flex-row lg:items-center lg:justify-between">
          <span aria-live="polite" className="text-sm text-muted-foreground">
            {clients.length} {clients.length === 1 ? "cliente OAuth" : "clientes OAuth"}
          </span>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="w-full sm:w-72">
              <SearchInput
                className="h-10 bg-card"
                onChange={(event) => setSearch(event.target.value)}
                onClear={() => setSearch("")}
                aria-label="Buscar clientes OAuth"
                placeholder="Buscar por cliente, audiencia, destino o scope"
                value={search}
              />
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button className="h-10 flex-1 px-4 font-semibold sm:flex-none" variant="outline" />}
                  aria-label="Filtrar por estado"
                  disabled={isPending}
                  type="button"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Filter className="size-4 text-muted-foreground" />
                    <span className="truncate">
                      {status ? statusLabels[status] : "Filtros"}
                    </span>
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuRadioGroup
                    aria-label="Estado del cliente OAuth"
                    onValueChange={(value) =>
                      setStatus(value as OAuthClientStatus | "")
                    }
                    value={status}
                  >
                    <DropdownMenuRadioItem
                      className="min-h-10 cursor-pointer px-2"
                      value=""
                    >
                      Todos los estados
                    </DropdownMenuRadioItem>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <DropdownMenuRadioItem
                        className="min-h-10 cursor-pointer px-2"
                        key={value}
                        value={value}
                      >
                        {label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button aria-label="Recargar clientes OAuth" className="size-10" disabled={isPending || pendingClientId !== null} onClick={refresh} size="icon" variant="ghost">
                <RefreshCw className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-border">
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
              isFiltered={Boolean(search.trim() || status)}
              onClearFilters={clearFilters}
              locale={locale}
              onDelete={(client) =>
                runAction(client, () => deleteOAuthClient(oauthClientId(client)))
              }
              onRotateSecret={handleRotateSecret}
              onStatus={(client, nextStatus) =>
                runAction(client, () =>
                  updateOAuthClient(oauthClientId(client), { status: nextStatus })
                )
              }
              pendingClientId={pendingClientId}
            />
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 text-sm text-muted-foreground">
          <span aria-live="polite">{filteredClients.length} de {clients.length} clientes</span>
          {search.trim() || status ? (
            <Button className="h-10" onClick={clearFilters} variant="ghost">Limpiar filtros</Button>
          ) : <span>Todos los estados</span>}
        </div>
      </section>
    </div>
  );
}
