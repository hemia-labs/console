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
import { IdentityStatusBadge } from "@/features/identity-access/components/identity-status-badge";
import type {
  CreateTeamPayload,
  IdentityTeam,
  UpdateTeamPayload,
} from "@/features/identity-access/types";
import { createTeam, deleteTeam, updateTeam } from "@/features/identity-access/teams/api";

type FormState =
  | { mode: "create"; team?: undefined }
  | { mode: "edit"; team: IdentityTeam }
  | null;

function teamId(team: IdentityTeam) {
  return team.id ? String(team.id) : "";
}

function initialForm(team?: IdentityTeam): CreateTeamPayload {
  return {
    description: team?.description ? String(team.description) : "",
    name: team?.name ? String(team.name) : "",
    organizationId: team?.organizationId ? String(team.organizationId) : "",
    slug: team?.slug ? String(team.slug) : "",
    status: team?.status ? String(team.status) : "",
  };
}

function TeamForm({
  error,
  form,
  onCancel,
  onSubmit,
  pending,
}: {
  error?: string | null;
  form: Exclude<FormState, null>;
  onCancel: () => void;
  onSubmit: (payload: CreateTeamPayload | UpdateTeamPayload) => Promise<void>;
  pending?: boolean;
}) {
  const [value, setValue] = useState(() => initialForm(form.team));

  function update<K extends keyof CreateTeamPayload>(key: K, next: CreateTeamPayload[K]) {
    setValue((current) => ({ ...current, [key]: next }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({
      description: value.description?.trim(),
      name: value.name.trim(),
      organizationId: value.organizationId?.trim(),
      slug: value.slug?.trim(),
      status: value.status?.trim(),
    });
  }

  return (
    <form className="rounded-lg border border-border bg-card p-5 shadow-sm" onSubmit={submit}>
      <h2 className="text-lg font-semibold">{form.mode === "create" ? "Crear team" : "Editar team"}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Recurso tenant-scoped; Console API deriva el tenant desde la cuenta activa/sesion.
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Nombre
          <Input className="h-12 bg-card" onChange={(event) => update("name", event.target.value)} required value={value.name} />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Organization ID
          <Input className="h-12 bg-card" onChange={(event) => update("organizationId", event.target.value)} value={value.organizationId ?? ""} />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Slug
          <Input className="h-12 bg-card" onChange={(event) => update("slug", event.target.value)} value={value.slug ?? ""} />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Estado
          <Input className="h-12 bg-card" onChange={(event) => update("status", event.target.value)} placeholder="active" value={value.status ?? ""} />
        </label>
        <label className="grid gap-2 text-sm font-medium md:col-span-2">
          Descripcion
          <Textarea className="min-h-24 bg-card" onChange={(event) => update("description", event.target.value)} value={value.description ?? ""} />
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

export function TeamsClient({
  initialError,
  teams,
}: {
  initialError?: string | null;
  teams: IdentityTeam[];
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
    if (!term) return teams;
    return teams.filter((team) =>
      [team.name, team.slug, team.status, team.description, team.organizationId].some((value) =>
        String(value ?? "").toLowerCase().includes(term)
      )
    );
  }, [search, teams]);

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

  async function submit(payload: CreateTeamPayload | UpdateTeamPayload) {
    setFormError(null);
    setFormPending(true);
    try {
      if (form?.mode === "edit") await updateTeam(teamId(form.team), payload);
      else await createTeam(payload as CreateTeamPayload);
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
            <Input className="h-12 bg-card pl-10" onChange={(event) => setSearch(event.target.value)} placeholder="Buscar teams" value={search} />
          </label>
          <Button className="h-12" onClick={() => { setForm({ mode: "create" }); setFormError(null); }} type="button">
            <Plus className="size-4" />
            Crear team
          </Button>
        </div>
      </div>
      {actionError ? <ErrorState actionLabel="Reintentar" error={new Error(actionError)} onRetry={refresh} title="No se pudo cargar teams" /> : null}
      {form ? <TeamForm error={formError} form={form} onCancel={() => setForm(null)} onSubmit={submit} pending={formPending || isPending} /> : null}
      {!actionError && filtered.length === 0 ? <EmptyState description="Crea un team o ajusta la busqueda." title="Sin teams" /> : null}
      {!actionError && filtered.length > 0 ? (
        <div className="rounded-lg border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <Table className="min-w-[940px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Team</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Organization ID</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Slug</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Estado</TableHead>
                  <TableHead className="w-20 px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((team) => {
                  const id = teamId(team);
                  return (
                    <TableRow key={id || team.name}>
                      <TableCell className="px-4 py-3">
                        <p className="font-semibold">{team.name}</p>
                        <p className="text-xs text-muted-foreground">{team.description ?? "Sin descripcion"}</p>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm">{team.organizationId ?? "No disponible"}</TableCell>
                      <TableCell className="px-4 py-3 text-sm">{team.slug ?? "No disponible"}</TableCell>
                      <TableCell className="px-4 py-3"><IdentityStatusBadge status={team.status} /></TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger aria-label="Acciones de team" className="inline-flex size-12 items-center justify-center rounded-md border border-border bg-background outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50" disabled={pendingId === id || !id} type="button">
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem className="min-h-12 cursor-pointer gap-2 px-2" onClick={() => { setForm({ mode: "edit", team }); setFormError(null); }}>
                              <Pencil className="size-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="min-h-12 cursor-pointer gap-2 px-2" onClick={() => { if (window.confirm("Esta accion eliminara el team. Continuar?")) runAction(id, () => deleteTeam(id)); }} variant="destructive">
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
