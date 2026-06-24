"use client";

import { CheckCircle2, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { apiErrorMessage } from "@/features/identity-access/components/identity-api-error";
import { IdentityStatusBadge } from "@/features/identity-access/components/identity-status-badge";
import type {
  CreateTenantPayload,
  IdentityTenant,
  TenantStatus,
  UpdateTenantPayload,
} from "@/features/identity-access/types";
import { tenantStatuses } from "@/features/identity-access/types";
import {
  createTenant,
  deleteTenant,
  updateTenant,
  updateTenantStatus,
} from "@/features/identity-access/tenants/api";

type FormState =
  | { mode: "create"; tenant?: undefined }
  | { mode: "edit"; tenant: IdentityTenant }
  | null;

function tenantId(tenant: IdentityTenant) {
  return tenant.id ? String(tenant.id) : "";
}

function tenantDate(value?: unknown) {
  if (!value) return "No disponible";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("es-MX");
}

function initialForm(tenant?: IdentityTenant): CreateTenantPayload {
  return {
    name: tenant?.name ? String(tenant.name) : "",
    ownerUserId: tenant?.ownerUserId ? String(tenant.ownerUserId) : "",
    plan: tenant?.plan ? String(tenant.plan) : "",
    slug: tenant?.slug ? String(tenant.slug) : "",
    status: (tenant?.status as TenantStatus | undefined) ?? "active",
  };
}

function TenantForm({
  error,
  form,
  onCancel,
  onSubmit,
  pending,
}: {
  error?: string | null;
  form: Exclude<FormState, null>;
  onCancel: () => void;
  onSubmit: (payload: CreateTenantPayload | UpdateTenantPayload) => Promise<void>;
  pending?: boolean;
}) {
  const [value, setValue] = useState(() => initialForm(form.tenant));

  function update<K extends keyof CreateTenantPayload>(key: K, next: CreateTenantPayload[K]) {
    setValue((current) => ({ ...current, [key]: next }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({
      name: value.name.trim(),
      ownerUserId: value.ownerUserId?.trim(),
      plan: value.plan?.trim(),
      slug: value.slug.trim(),
      status: value.status,
    });
  }

  return (
    <form className="rounded-lg border border-border bg-card p-5 shadow-sm" onSubmit={submit}>
      <h2 className="text-lg font-semibold">
        {form.mode === "create" ? "Crear tenant" : "Editar tenant"}
      </h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Nombre
          <Input className="h-12 bg-card" onChange={(e) => update("name", e.target.value)} required value={value.name} />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Slug
          <Input className="h-12 bg-card" onChange={(e) => update("slug", e.target.value)} required value={value.slug} />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Estado
          <select className="h-12 rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" onChange={(e) => update("status", e.target.value as TenantStatus)} value={value.status}>
            {tenantStatuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Plan
          <Input className="h-12 bg-card" onChange={(e) => update("plan", e.target.value)} value={value.plan ?? ""} />
        </label>
        <label className="grid gap-2 text-sm font-medium md:col-span-2">
          Owner user ID
          <Input className="h-12 bg-card" onChange={(e) => update("ownerUserId", e.target.value)} value={value.ownerUserId ?? ""} />
        </label>
      </div>
      {error ? <p className="mt-4 text-sm font-medium text-destructive">{error}</p> : null}
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button className="h-12" disabled={pending} onClick={onCancel} type="button" variant="outline">Cancelar</Button>
        <Button className="h-12" disabled={pending} type="submit">Guardar</Button>
      </div>
    </form>
  );
}

export function TenantsClient({
  initialError,
  tenants,
}: {
  initialError?: string | null;
  tenants: IdentityTenant[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(initialError ?? null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [formPending, setFormPending] = useState(false);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return tenants;
    return tenants.filter((tenant) =>
      [tenant.name, tenant.slug, tenant.plan, tenant.status].some((value) =>
        String(value ?? "").toLowerCase().includes(term)
      )
    );
  }, [search, tenants]);

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function runAction(id: string, action: () => Promise<unknown>) {
    setPendingId(id);
    setActionError(null);
    try {
      await action();
      refresh();
    } catch (error) {
      setActionError(apiErrorMessage(error));
    } finally {
      setPendingId(null);
    }
  }

  async function submit(payload: CreateTenantPayload | UpdateTenantPayload) {
    setFormError(null);
    setFormPending(true);
    try {
      if (form?.mode === "edit") await updateTenant(tenantId(form.tenant), payload);
      else await createTenant(payload as CreateTenantPayload);
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
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-12 bg-card pl-10" onChange={(e) => setSearch(e.target.value)} placeholder="Buscar tenants" value={search} />
          </label>
          <Button className="h-12" onClick={() => { setForm({ mode: "create" }); setFormError(null); }} type="button">
            <Plus className="size-4" />
            Crear tenant
          </Button>
        </div>
      </div>
      {actionError ? <ErrorState actionLabel="Reintentar" error={new Error(actionError)} onRetry={refresh} title="No se pudo cargar tenants" /> : null}
      {form ? <TenantForm error={formError} form={form} onCancel={() => setForm(null)} onSubmit={submit} pending={formPending || isPending} /> : null}
      {!actionError && filtered.length === 0 ? <EmptyState description="Crea un tenant o ajusta la busqueda." title="Sin tenants" /> : null}
      {!actionError && filtered.length > 0 ? (
        <div className="rounded-lg border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <Table className="min-w-[920px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Tenant</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Slug</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Estado</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Plan</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Actualizado</TableHead>
                  <TableHead className="w-20 px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((tenant) => {
                  const id = tenantId(tenant);
                  const pending = pendingId === id;
                  return (
                    <TableRow key={id || tenant.name}>
                      <TableCell className="px-4 py-3 font-semibold">{tenant.name}</TableCell>
                      <TableCell className="px-4 py-3 text-sm">{tenant.slug ?? "No disponible"}</TableCell>
                      <TableCell className="px-4 py-3"><IdentityStatusBadge status={String(tenant.status ?? "")} /></TableCell>
                      <TableCell className="px-4 py-3 text-sm">{tenant.plan ?? "No disponible"}</TableCell>
                      <TableCell className="px-4 py-3 text-sm text-muted-foreground">{tenantDate(tenant.updatedAt)}</TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger aria-label="Acciones de tenant" className="inline-flex size-12 items-center justify-center rounded-md border border-border bg-background outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50" disabled={pending || !id} type="button">
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem className="min-h-12 cursor-pointer gap-2 px-2" onClick={() => { setForm({ mode: "edit", tenant }); setFormError(null); }}>
                              <Pencil className="size-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="min-h-12 cursor-pointer gap-2 px-2" onClick={() => runAction(id, () => updateTenantStatus(id, "active"))}>
                              <CheckCircle2 className="size-4" /> Activar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="min-h-12 cursor-pointer gap-2 px-2" onClick={() => runAction(id, () => updateTenantStatus(id, "suspended"))}>
                              Suspender
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="min-h-12 cursor-pointer gap-2 px-2" onClick={() => { if (window.confirm("Esta accion eliminara el tenant. Continuar?")) runAction(id, () => deleteTenant(id)); }} variant="destructive">
                              <Trash2 className="size-4" /> Eliminar
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
