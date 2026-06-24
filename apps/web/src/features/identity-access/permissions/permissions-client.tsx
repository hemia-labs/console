"use client";

import { Plus, RefreshCw, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
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
import type {
  CreatePermissionPayload,
  IdentityPermission,
} from "@/features/identity-access/types";
import {
  createPermission,
  syncBasePermissions,
} from "@/features/identity-access/permissions/api";

function initialForm(): CreatePermissionPayload {
  return {
    action: "",
    description: "",
    key: "",
    resource: "",
  };
}

function PermissionForm({
  error,
  onCancel,
  onSubmit,
  pending,
}: {
  error?: string | null;
  onCancel: () => void;
  onSubmit: (payload: CreatePermissionPayload) => Promise<void>;
  pending?: boolean;
}) {
  const [value, setValue] = useState(initialForm);

  function update<K extends keyof CreatePermissionPayload>(key: K, next: CreatePermissionPayload[K]) {
    setValue((current) => ({ ...current, [key]: next }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({
      action: value.action?.trim(),
      description: value.description?.trim(),
      key: value.key.trim(),
      resource: value.resource?.trim(),
    });
  }

  return (
    <form className="rounded-lg border border-border bg-card p-5 shadow-sm" onSubmit={submit}>
      <h2 className="text-lg font-semibold">Crear permiso</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Key
          <Input className="h-12 bg-card" onChange={(e) => update("key", e.target.value)} required value={value.key} />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Resource
          <Input className="h-12 bg-card" onChange={(e) => update("resource", e.target.value)} value={value.resource ?? ""} />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Action
          <Input className="h-12 bg-card" onChange={(e) => update("action", e.target.value)} value={value.action ?? ""} />
        </label>
        <label className="grid gap-2 text-sm font-medium md:col-span-2">
          Descripcion
          <Textarea className="min-h-24 bg-card" onChange={(e) => update("description", e.target.value)} value={value.description ?? ""} />
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

export function PermissionsClient({
  initialError,
  permissions,
}: {
  initialError?: string | null;
  permissions: IdentityPermission[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(initialError ?? null);
  const [formPending, setFormPending] = useState(false);
  const [syncPending, setSyncPending] = useState(false);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return permissions;
    return permissions.filter((permission) =>
      [permission.key, permission.resource, permission.action, permission.description].some((value) =>
        String(value ?? "").toLowerCase().includes(term)
      )
    );
  }, [permissions, search]);

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function submit(payload: CreatePermissionPayload) {
    setFormError(null);
    setFormPending(true);
    try {
      await createPermission(payload);
      setShowForm(false);
      refresh();
    } catch (error) {
      setFormError(apiErrorMessage(error));
    } finally {
      setFormPending(false);
    }
  }

  async function syncBase() {
    if (!window.confirm("Sincronizar permisos base?")) return;
    setActionError(null);
    setSyncPending(true);
    try {
      await syncBasePermissions();
      refresh();
    } catch (error) {
      setActionError(apiErrorMessage(error));
    } finally {
      setSyncPending(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-12 bg-card pl-10" onChange={(e) => setSearch(e.target.value)} placeholder="Buscar permisos" value={search} />
          </label>
          <Button className="h-12" disabled={syncPending || isPending} onClick={syncBase} type="button" variant="outline">
            <RefreshCw className="size-4" />
            Sync base
          </Button>
          <Button className="h-12" onClick={() => { setShowForm(true); setFormError(null); }} type="button">
            <Plus className="size-4" />
            Crear permiso
          </Button>
        </div>
      </div>
      {actionError ? <ErrorState actionLabel="Reintentar" error={new Error(actionError)} onRetry={refresh} title="No se pudo cargar permisos" /> : null}
      {showForm ? <PermissionForm error={formError} onCancel={() => setShowForm(false)} onSubmit={submit} pending={formPending || isPending} /> : null}
      {!actionError && filtered.length === 0 ? <EmptyState description="Crea un permiso o ajusta la busqueda." title="Sin permisos" /> : null}
      {!actionError && filtered.length > 0 ? (
        <div className="rounded-lg border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <Table className="min-w-[820px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Key</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Resource</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Action</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Descripcion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((permission) => (
                  <TableRow key={permission.id || permission.key}>
                    <TableCell className="px-4 py-3 font-semibold">{permission.key}</TableCell>
                    <TableCell className="px-4 py-3 text-sm">{permission.resource ?? "No disponible"}</TableCell>
                    <TableCell className="px-4 py-3 text-sm">{permission.action ?? "No disponible"}</TableCell>
                    <TableCell className="px-4 py-3 text-sm text-muted-foreground">{permission.description ?? "Sin descripcion"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
