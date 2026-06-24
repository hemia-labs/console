"use client";

import { MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { apiErrorMessage } from "@/features/identity-access/components/identity-api-error";
import type {
  CreateRolePayload,
  IdentityRole,
  UpdateRolePayload,
} from "@/features/identity-access/types";
import {
  assignPermissionToRole,
  assignRoleToUser,
  createRole,
  deleteRole,
  removePermissionFromRole,
  removeRoleFromUser,
  updateRole,
} from "@/features/identity-access/roles/api";

type FormState =
  | { mode: "create"; role?: undefined }
  | { mode: "edit"; role: IdentityRole }
  | null;

function roleId(role: IdentityRole) {
  return role.id ? String(role.id) : "";
}

function initialForm(role?: IdentityRole): CreateRolePayload {
  return {
    description: role?.description ? String(role.description) : "",
    isSystem: Boolean(role?.isSystem),
    key: role?.key ? String(role.key) : "",
    name: role?.name ? String(role.name) : "",
    scope: role?.scope ? String(role.scope) : "",
  };
}

function RoleForm({
  error,
  form,
  onCancel,
  onSubmit,
  pending,
}: {
  error?: string | null;
  form: Exclude<FormState, null>;
  onCancel: () => void;
  onSubmit: (payload: CreateRolePayload | UpdateRolePayload) => Promise<void>;
  pending?: boolean;
}) {
  const [value, setValue] = useState(() => initialForm(form.role));

  function update<K extends keyof CreateRolePayload>(key: K, next: CreateRolePayload[K]) {
    setValue((current) => ({ ...current, [key]: next }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({
      description: value.description?.trim(),
      isSystem: value.isSystem,
      key: value.key?.trim(),
      name: value.name.trim(),
      scope: value.scope?.trim(),
    });
  }

  return (
    <form className="rounded-lg border border-border bg-card p-5 shadow-sm" onSubmit={submit}>
      <h2 className="text-lg font-semibold">
        {form.mode === "create" ? "Crear rol" : "Editar rol"}
      </h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Nombre
          <Input className="h-12 bg-card" onChange={(e) => update("name", e.target.value)} required value={value.name} />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Key
          <Input className="h-12 bg-card" onChange={(e) => update("key", e.target.value)} value={value.key ?? ""} />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Scope
          <Input className="h-12 bg-card" onChange={(e) => update("scope", e.target.value)} value={value.scope ?? ""} />
        </label>
        <label className="flex min-h-12 items-center gap-3 text-sm font-medium">
          <input checked={Boolean(value.isSystem)} className="size-4" onChange={(e) => update("isSystem", e.target.checked)} type="checkbox" />
          Rol de sistema
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

function AssignmentPanel({
  error,
  onSubmit,
  pending,
}: {
  error?: string | null;
  onSubmit: (kind: string, payload: { permissionId?: string; roleId?: string; userId?: string }) => Promise<void>;
  pending?: boolean;
}) {
  const [roleIdValue, setRoleIdValue] = useState("");
  const [permissionId, setPermissionId] = useState("");
  const [userId, setUserId] = useState("");
  const [userRoleId, setUserRoleId] = useState("");

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Asignaciones por ID</h2>
      <p className="mt-1 text-sm text-muted-foreground">Operacion minima hasta tener selectores de usuarios y permisos.</p>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); onSubmit("assignPermission", { permissionId, roleId: roleIdValue }); }}>
          <Input className="h-12 bg-card" onChange={(e) => setRoleIdValue(e.target.value)} placeholder="Role ID" required value={roleIdValue} />
          <Input className="h-12 bg-card" onChange={(e) => setPermissionId(e.target.value)} placeholder="Permission ID" required value={permissionId} />
          <div className="flex flex-wrap gap-2">
            <Button className="h-12" disabled={pending} type="submit">Asignar permiso</Button>
            <Button className="h-12" disabled={pending} onClick={() => { if (window.confirm("Quitar permiso del rol?")) onSubmit("removePermission", { permissionId, roleId: roleIdValue }); }} type="button" variant="outline">Quitar permiso</Button>
          </div>
        </form>
        <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); onSubmit("assignUser", { roleId: userRoleId, userId }); }}>
          <Input className="h-12 bg-card" onChange={(e) => setUserId(e.target.value)} placeholder="User ID" required value={userId} />
          <Input className="h-12 bg-card" onChange={(e) => setUserRoleId(e.target.value)} placeholder="Role ID" required value={userRoleId} />
          <div className="flex flex-wrap gap-2">
            <Button className="h-12" disabled={pending} type="submit">Asignar rol</Button>
            <Button className="h-12" disabled={pending} onClick={() => { if (window.confirm("Quitar rol del usuario?")) onSubmit("removeUser", { roleId: userRoleId, userId }); }} type="button" variant="outline">Quitar rol</Button>
          </div>
        </form>
      </div>
      {error ? <p className="mt-4 text-sm font-medium text-destructive">{error}</p> : null}
    </section>
  );
}

export function RolesClient({
  initialError,
  roles,
}: {
  initialError?: string | null;
  roles: IdentityRole[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(initialError ?? null);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [formPending, setFormPending] = useState(false);
  const [assignmentPending, setAssignmentPending] = useState(false);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return roles;
    return roles.filter((role) =>
      [role.name, role.key, role.scope, role.description].some((value) =>
        String(value ?? "").toLowerCase().includes(term)
      )
    );
  }, [roles, search]);

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

  async function submit(payload: CreateRolePayload | UpdateRolePayload) {
    setFormError(null);
    setFormPending(true);
    try {
      if (form?.mode === "edit") await updateRole(roleId(form.role), payload);
      else await createRole(payload as CreateRolePayload);
      setForm(null);
      refresh();
    } catch (error) {
      setFormError(apiErrorMessage(error));
    } finally {
      setFormPending(false);
    }
  }

  async function submitAssignment(kind: string, payload: { permissionId?: string; roleId?: string; userId?: string }) {
    setAssignmentError(null);
    setAssignmentPending(true);
    try {
      if (kind === "assignPermission" && payload.roleId && payload.permissionId) await assignPermissionToRole(payload.roleId, payload.permissionId);
      if (kind === "removePermission" && payload.roleId && payload.permissionId) await removePermissionFromRole(payload.roleId, payload.permissionId);
      if (kind === "assignUser" && payload.userId && payload.roleId) await assignRoleToUser(payload.userId, payload.roleId);
      if (kind === "removeUser" && payload.userId && payload.roleId) await removeRoleFromUser(payload.userId, payload.roleId);
      refresh();
    } catch (error) {
      setAssignmentError(apiErrorMessage(error));
    } finally {
      setAssignmentPending(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-12 bg-card pl-10" onChange={(e) => setSearch(e.target.value)} placeholder="Buscar roles" value={search} />
          </label>
          <Button className="h-12" onClick={() => { setForm({ mode: "create" }); setFormError(null); }} type="button">
            <Plus className="size-4" />
            Crear rol
          </Button>
        </div>
      </div>
      {actionError ? <ErrorState actionLabel="Reintentar" error={new Error(actionError)} onRetry={refresh} title="No se pudo cargar roles" /> : null}
      {form ? <RoleForm error={formError} form={form} onCancel={() => setForm(null)} onSubmit={submit} pending={formPending || isPending} /> : null}
      <AssignmentPanel error={assignmentError} onSubmit={submitAssignment} pending={assignmentPending || isPending} />
      {!actionError && filtered.length === 0 ? <EmptyState description="Crea un rol o ajusta la busqueda." title="Sin roles" /> : null}
      {!actionError && filtered.length > 0 ? (
        <div className="rounded-lg border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Rol</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Key</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Scope</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Sistema</TableHead>
                  <TableHead className="w-20 px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((role) => {
                  const id = roleId(role);
                  return (
                    <TableRow key={id || role.name}>
                      <TableCell className="px-4 py-3">
                        <p className="font-semibold">{role.name}</p>
                        <p className="text-xs text-muted-foreground">{role.description ?? "Sin descripcion"}</p>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm">{role.key ?? "No disponible"}</TableCell>
                      <TableCell className="px-4 py-3 text-sm">{role.scope ?? "No disponible"}</TableCell>
                      <TableCell className="px-4 py-3 text-sm">{role.isSystem ? "Si" : "No"}</TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger aria-label="Acciones de rol" className="inline-flex size-12 items-center justify-center rounded-md border border-border bg-background outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50" disabled={pendingId === id || !id} type="button">
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem className="min-h-12 cursor-pointer gap-2 px-2" onClick={() => { setForm({ mode: "edit", role }); setFormError(null); }}>
                              <Pencil className="size-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="min-h-12 cursor-pointer gap-2 px-2" onClick={() => { if (window.confirm("Esta accion eliminara el rol. Continuar?")) runAction(id, () => deleteRole(id)); }} variant="destructive">
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
