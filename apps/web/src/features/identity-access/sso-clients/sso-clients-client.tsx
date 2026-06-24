"use client";

import { CheckCircle2, Filter, MoreHorizontal, Pencil, Plus, PowerOff, Search, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { apiErrorMessage } from "@/features/identity-access/components/identity-api-error";
import { IdentityStatusBadge } from "@/features/identity-access/components/identity-status-badge";
import type {
  CreateSsoClientPayload,
  IdentitySsoClient,
  SsoClientStatus,
  UpdateSsoClientPayload,
} from "@/features/identity-access/types";
import { ssoClientStatuses } from "@/features/identity-access/types";
import {
  createSsoClient,
  deleteSsoClient,
  updateSsoClient,
} from "@/features/identity-access/sso-clients/api";

type FormState =
  | { client?: undefined; mode: "create" }
  | { client: IdentitySsoClient; mode: "edit" }
  | null;

const statusLabels: Record<SsoClientStatus, string> = {
  active: "Activo",
  deleted: "Eliminado",
  suspended: "Suspendido",
};

function ssoClientId(client: IdentitySsoClient) {
  return String(client.id || client.clientId || "");
}

function parseLines(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatLines(values?: string[]) {
  return values?.join("\n") ?? "";
}

function joinList(values?: string[]) {
  return values && values.length > 0 ? values.join(", ") : "No configurado";
}

function initialForm(client?: IdentitySsoClient) {
  return {
    allowedOrigins: formatLines(client?.allowedOrigins),
    allowedRedirectUris: formatLines(client?.allowedRedirectUris),
    clientId: client?.clientId ? String(client.clientId) : "",
    name: client?.name ? String(client.name) : "",
    status: (client?.status ?? "active") as SsoClientStatus,
  };
}

function SsoClientForm({
  error,
  form,
  onCancel,
  onSubmit,
  pending,
}: {
  error?: string | null;
  form: Exclude<FormState, null>;
  onCancel: () => void;
  onSubmit: (payload: CreateSsoClientPayload | UpdateSsoClientPayload) => Promise<void>;
  pending?: boolean;
}) {
  const [value, setValue] = useState(() => initialForm(form.client));

  function update<K extends keyof ReturnType<typeof initialForm>>(
    key: K,
    next: ReturnType<typeof initialForm>[K]
  ) {
    setValue((current) => ({ ...current, [key]: next }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({
      allowedOrigins: parseLines(value.allowedOrigins),
      allowedRedirectUris: parseLines(value.allowedRedirectUris),
      clientId: value.clientId.trim(),
      name: value.name.trim(),
      status: value.status,
    });
  }

  return (
    <form className="rounded-lg border border-border bg-card p-5 shadow-sm" onSubmit={submit}>
      <h2 className="text-lg font-semibold">
        {form.mode === "create" ? "Crear SSO client" : "Editar SSO client"}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        SSO clients no exponen secreto one-time; esa operacion aplica solo a OAuth clients.
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Client ID
          <Input
            className="h-12 bg-card"
            onChange={(event) => update("clientId", event.target.value)}
            required
            value={value.clientId}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Nombre
          <Input
            className="h-12 bg-card"
            onChange={(event) => update("name", event.target.value)}
            required
            value={value.name}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Estado
          <select
            className="h-12 rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            onChange={(event) => update("status", event.target.value as SsoClientStatus)}
            value={value.status}
          >
            {ssoClientStatuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium md:col-span-2">
          Allowed redirect URIs
          <Textarea
            className="min-h-28 bg-card"
            onChange={(event) => update("allowedRedirectUris", event.target.value)}
            placeholder="https://console.hemia.cloud/sso/callback"
            required
            value={value.allowedRedirectUris}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium md:col-span-2">
          Allowed origins
          <Textarea
            className="min-h-24 bg-card"
            onChange={(event) => update("allowedOrigins", event.target.value)}
            placeholder="https://console.hemia.cloud"
            value={value.allowedOrigins}
          />
        </label>
      </div>
      {error ? <p className="mt-4 text-sm font-medium text-destructive">{error}</p> : null}
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button className="h-12" disabled={pending} onClick={onCancel} type="button" variant="outline">
          Cancelar
        </Button>
        <Button className="h-12" disabled={pending} type="submit">
          Guardar
        </Button>
      </div>
    </form>
  );
}

export function SsoClientsClient({
  clients,
  initialError,
}: {
  clients: IdentitySsoClient[];
  initialError?: string | null;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<SsoClientStatus | "">("");
  const [form, setForm] = useState<FormState>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(initialError ?? null);
  const [pendingClientId, setPendingClientId] = useState<string | null>(null);
  const [formPending, setFormPending] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filteredClients = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return clients.filter((client) => {
      const matchesStatus = status ? client.status === status : true;
      const searchable = [
        client.clientId,
        client.name,
        client.status,
        ...(client.allowedRedirectUris ?? []),
        ...(client.allowedOrigins ?? []),
      ];
      const matchesSearch = normalizedSearch
        ? searchable.some((value) => String(value ?? "").toLowerCase().includes(normalizedSearch))
        : true;

      return matchesStatus && matchesSearch;
    });
  }, [clients, search, status]);

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function runAction(client: IdentitySsoClient, action: () => Promise<unknown>) {
    const id = ssoClientId(client);
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

  async function submit(payload: CreateSsoClientPayload | UpdateSsoClientPayload) {
    setFormError(null);
    setFormPending(true);
    try {
      if (form?.mode === "edit") await updateSsoClient(ssoClientId(form.client), payload);
      else await createSsoClient(payload as CreateSsoClientPayload);
      setForm(null);
      refresh();
    } catch (error) {
      setFormError(apiErrorMessage(error));
    } finally {
      setFormPending(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_14rem_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-12 bg-card pl-10"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por client ID, nombre o URL"
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
                onValueChange={(value) => setStatus(value as SsoClientStatus | "")}
                value={status}
              >
                <DropdownMenuRadioItem className="min-h-12 cursor-pointer px-2" value="">
                  Todos los estados
                </DropdownMenuRadioItem>
                {ssoClientStatuses.map((item) => (
                  <DropdownMenuRadioItem className="min-h-12 cursor-pointer px-2" key={item} value={item}>
                    {statusLabels[item]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            className="h-12"
            onClick={() => {
              setForm({ mode: "create" });
              setFormError(null);
            }}
            type="button"
          >
            <Plus className="size-4" />
            Crear SSO client
          </Button>
        </div>
      </div>

      {actionError ? (
        <ErrorState
          actionLabel="Reintentar"
          error={new Error(actionError)}
          onRetry={refresh}
          title="No se pudo cargar SSO clients"
        />
      ) : null}

      {form ? (
        <SsoClientForm
          error={formError}
          form={form}
          onCancel={() => setForm(null)}
          onSubmit={submit}
          pending={formPending || isPending}
        />
      ) : null}

      {!actionError && filteredClients.length === 0 ? (
        <EmptyState description="Ajusta los filtros o crea un SSO client para comenzar." title="Sin SSO clients" />
      ) : null}

      {!actionError && filteredClients.length > 0 ? (
        <div className="rounded-lg border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <Table className="min-w-[1040px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Client ID</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Nombre</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Estado</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Redirect URIs</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Origins</TableHead>
                  <TableHead className="w-20 px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => {
                  const id = ssoClientId(client);
                  const pending = pendingClientId === id;
                  const currentStatus = (client.status ?? "active") as SsoClientStatus;
                  return (
                    <TableRow key={id || client.clientId}>
                      <TableCell className="px-4 py-3">
                        <p className="truncate text-sm font-semibold">{client.clientId}</p>
                        {id && id !== client.clientId ? <p className="mt-1 truncate text-xs text-muted-foreground">{id}</p> : null}
                      </TableCell>
                      <TableCell className="max-w-[220px] px-4 py-3 text-sm">
                        <p className="truncate">{client.name || "No disponible"}</p>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <IdentityStatusBadge status={currentStatus} />
                      </TableCell>
                      <TableCell className="max-w-[260px] px-4 py-3 text-sm text-muted-foreground">
                        <p className="truncate">{joinList(client.allowedRedirectUris)}</p>
                      </TableCell>
                      <TableCell className="max-w-[220px] px-4 py-3 text-sm text-muted-foreground">
                        <p className="truncate">{joinList(client.allowedOrigins)}</p>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            aria-label="Acciones de SSO client"
                            className="inline-flex size-12 shrink-0 items-center justify-center rounded-md border border-border bg-background text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
                            disabled={pending || !id}
                            type="button"
                          >
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem
                              className="min-h-12 cursor-pointer gap-2 px-2"
                              onClick={() => {
                                setForm({ client, mode: "edit" });
                                setFormError(null);
                              }}
                            >
                              <Pencil className="size-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {currentStatus === "active" ? (
                              <DropdownMenuItem
                                className="min-h-12 cursor-pointer gap-2 px-2"
                                onClick={() => {
                                  if (window.confirm("Esta accion suspendera el SSO client. Continuar?")) {
                                    runAction(client, () => updateSsoClient(id, { status: "suspended" }));
                                  }
                                }}
                              >
                                <PowerOff className="size-4" />
                                Suspender
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="min-h-12 cursor-pointer gap-2 px-2"
                                onClick={() => {
                                  if (window.confirm("Esta accion activara el SSO client. Continuar?")) {
                                    runAction(client, () => updateSsoClient(id, { status: "active" }));
                                  }
                                }}
                              >
                                <CheckCircle2 className="size-4" />
                                Activar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="min-h-12 cursor-pointer gap-2 px-2"
                              onClick={() => {
                                if (window.confirm("Esta accion eliminara el SSO client. Continuar?")) {
                                  runAction(client, () => deleteSsoClient(id));
                                }
                              }}
                              variant="destructive"
                            >
                              <Trash2 className="size-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
