"use client";

import { MoreHorizontal, Plus, Search, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

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
  CreateMembershipPayload,
  IdentityMembership,
} from "@/features/identity-access/types";
import {
  createMembership,
  deleteMembership,
  updateMembershipStatus,
} from "@/features/identity-access/memberships/api";

function membershipId(membership: IdentityMembership) {
  return membership.id ? String(membership.id) : "";
}

function initialForm(): CreateMembershipPayload {
  return {
    organizationId: "",
    roleId: "",
    status: "active",
    teamId: "",
    userId: "",
  };
}

function MembershipForm({
  error,
  onCancel,
  onSubmit,
  pending,
}: {
  error?: string | null;
  onCancel: () => void;
  onSubmit: (payload: CreateMembershipPayload) => Promise<void>;
  pending?: boolean;
}) {
  const [value, setValue] = useState(initialForm);

  function update<K extends keyof CreateMembershipPayload>(
    key: K,
    next: CreateMembershipPayload[K]
  ) {
    setValue((current) => ({ ...current, [key]: next }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({
      organizationId: value.organizationId?.trim(),
      roleId: value.roleId?.trim(),
      status: value.status?.trim(),
      teamId: value.teamId?.trim(),
      userId: value.userId.trim(),
    });
  }

  return (
    <form className="rounded-lg border border-border bg-card p-5 shadow-sm" onSubmit={submit}>
      <h2 className="text-lg font-semibold">Crear membresia</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Recurso tenant-scoped; Console API deriva el tenant desde la cuenta activa/sesion.
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          User ID
          <Input className="h-12 bg-card" onChange={(event) => update("userId", event.target.value)} required value={value.userId} />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Organization ID
          <Input className="h-12 bg-card" onChange={(event) => update("organizationId", event.target.value)} value={value.organizationId ?? ""} />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Team ID
          <Input className="h-12 bg-card" onChange={(event) => update("teamId", event.target.value)} value={value.teamId ?? ""} />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Role ID
          <Input className="h-12 bg-card" onChange={(event) => update("roleId", event.target.value)} value={value.roleId ?? ""} />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Estado
          <Input className="h-12 bg-card" onChange={(event) => update("status", event.target.value)} value={value.status ?? ""} />
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

export function MembershipsClient({
  initialError,
  memberships,
}: {
  initialError?: string | null;
  memberships: IdentityMembership[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(initialError ?? null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [formPending, setFormPending] = useState(false);
  const [userId, setUserId] = useState(searchParams.get("userId") ?? "");
  const [statusValue, setStatusValue] = useState("active");
  const [isPending, startTransition] = useTransition();

  function refresh() {
    startTransition(() => router.refresh());
  }

  function applyFilter() {
    const params = new URLSearchParams(searchParams.toString());
    if (userId.trim()) params.set("userId", userId.trim());
    else params.delete("userId");
    startTransition(() => {
      router.push(`?${params.toString()}`);
      router.refresh();
    });
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

  async function submit(payload: CreateMembershipPayload) {
    setFormError(null);
    setFormPending(true);
    try {
      await createMembership(payload);
      setShowForm(false);
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
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-12 bg-card pl-10"
              onChange={(event) => setUserId(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") applyFilter();
              }}
              placeholder="Filtrar por User ID"
              value={userId}
            />
          </label>
          <Button className="h-12" disabled={isPending} onClick={applyFilter} type="button" variant="outline">
            Filtrar
          </Button>
          <Button className="h-12" onClick={() => { setShowForm(true); setFormError(null); }} type="button">
            <Plus className="size-4" />
            Crear membresia
          </Button>
        </div>
      </div>
      {actionError ? <ErrorState actionLabel="Reintentar" error={new Error(actionError)} onRetry={refresh} title="No se pudo cargar membresias" /> : null}
      {showForm ? <MembershipForm error={formError} onCancel={() => setShowForm(false)} onSubmit={submit} pending={formPending || isPending} /> : null}
      {!actionError && memberships.length === 0 ? <EmptyState description="Crea una membresia o filtra por User ID." title="Sin membresias" /> : null}
      {!actionError && memberships.length > 0 ? (
        <div className="rounded-lg border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <Table className="min-w-[980px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">User ID</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Organization ID</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Team ID</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Role ID</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Estado</TableHead>
                  <TableHead className="w-20 px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberships.map((membership) => {
                  const id = membershipId(membership);
                  return (
                    <TableRow key={id || `${membership.userId}-${membership.roleId}`}>
                      <TableCell className="px-4 py-3 text-sm">{membership.userId ?? "No disponible"}</TableCell>
                      <TableCell className="px-4 py-3 text-sm">{membership.organizationId ?? "No disponible"}</TableCell>
                      <TableCell className="px-4 py-3 text-sm">{membership.teamId ?? "No disponible"}</TableCell>
                      <TableCell className="px-4 py-3 text-sm">{membership.roleId ?? "No disponible"}</TableCell>
                      <TableCell className="px-4 py-3"><IdentityStatusBadge status={membership.status} /></TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger aria-label="Acciones de membresia" className="inline-flex size-12 items-center justify-center rounded-md border border-border bg-background outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50" disabled={pendingId === id || !id} type="button">
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-64">
                            <div className="grid gap-2 p-2">
                              <Input className="h-12 bg-card" onChange={(event) => setStatusValue(event.target.value)} placeholder="Nuevo status" value={statusValue} />
                              <Button className="h-12" onClick={() => runAction(id, () => updateMembershipStatus(id, statusValue.trim()))} type="button">
                                Cambiar status
                              </Button>
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="min-h-12 cursor-pointer gap-2 px-2" onClick={() => { if (window.confirm("Esta accion eliminara la membresia. Continuar?")) runAction(id, () => deleteMembership(id)); }} variant="destructive">
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
