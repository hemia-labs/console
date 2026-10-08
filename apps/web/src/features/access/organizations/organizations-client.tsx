"use client";

import { MoreHorizontal, Pencil, Plus, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/zuno/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/zuno/dropdown-menu";
import { Input } from "@/components/zuno/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiErrorMessage } from "@/features/identity-access/components/identity-api-error";
import { localizedHref } from "@/lib/nav";
import {
  changeOrganizationStatus,
  createOrganization,
  updateOrganization,
} from "./api";
import { OrganizationForm } from "./organization-form";
import { OrganizationStatusBadge } from "./organization-status-badge";
import type {
  AccessOrganization,
  OrganizationFilters,
  OrganizationFormPayload,
} from "./types";

type FormState =
  | { mode: "create"; organization?: undefined }
  | { mode: "edit"; organization: AccessOrganization }
  | null;

function dateLabel(value?: string | null) {
  if (!value) return "No disponible";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("es-MX");
}

function idOf(organization: AccessOrganization) {
  return String(organization.id);
}

export function OrganizationsClient({
  initialError,
  onRefresh,
  initialFilters,
  locale,
  organizations,
}: {
  initialError?: string | null;
  onRefresh: () => void;
  initialFilters: OrganizationFilters;
  locale: string;
  organizations: AccessOrganization[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(
    initialError ?? null
  );
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [filters, setFilters] = useState({
    search: initialFilters.search ?? "",
    status: initialFilters.status ?? "",
    type: initialFilters.type ?? "",
  });

  function refresh() {
    startTransition(() => {
      setActionError(null);
      onRefresh();
    });
  }

  function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (filters.search.trim()) params.set("search", filters.search.trim());
    if (filters.status) params.set("status", filters.status);
    if (filters.type.trim()) params.set("type", filters.type.trim());
    router.replace(params.toString() ? `${pathname}?${params}` : pathname, {
      scroll: false,
    });
  }

  async function runAction(
    id: string,
    action: "activate" | "archive" | "suspend"
  ) {
    setPendingId(id);
    setActionError(null);
    try {
      await changeOrganizationStatus(id, action);
      refresh();
    } catch (error) {
      setActionError(apiErrorMessage(error));
    } finally {
      setPendingId(null);
    }
  }

  async function submit(payload: OrganizationFormPayload) {
    setFormError(null);
    try {
      if (form?.mode === "edit")
        await updateOrganization(idOf(form.organization), payload);
      else
        await createOrganization(
          payload as Extract<OrganizationFormPayload, { code: string }>
        );
      setForm(null);
      refresh();
    } catch (error) {
      setFormError(apiErrorMessage(error));
    }
  }

  function confirmAction(
    id: string,
    action: "activate" | "archive" | "suspend"
  ) {
    const messages = {
      activate: "¿Quieres activar esta organización?",
      archive: "Esta acción archivará la organización. ¿Continuar?",
      suspend: "¿Quieres suspender esta organización?",
    };
    if (window.confirm(messages[action])) void runAction(id, action);
  }

  return (
    <div className="space-y-5">
      <form
        className="rounded-lg border border-border bg-card p-4 shadow-sm"
        onSubmit={applyFilters}
      >
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_12rem_12rem_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-8 bg-card pl-10"
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  search: event.target.value,
                }))
              }
              placeholder="Buscar organizaciones"
              value={filters.search}
            />
          </label>
          <select
            aria-label="Filtrar por estado"
            className="h-8 rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                status: event.target.value,
              }))
            }
            value={filters.status}
          >
            <option value="">Todos los estados</option>
            <option value="active">Activa</option>
            <option value="suspended">Suspendida</option>
            <option value="archived">Archivada</option>
          </select>
          <Input
            className="h-8 bg-card"
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                type: event.target.value,
              }))
            }
            placeholder="Tipo"
            value={filters.type}
          />
          <Button className="h-8" type="submit" variant="outline">
            Aplicar
          </Button>
        </div>
      </form>

      <div className="flex justify-end">
        <Button
          className="h-8"
          onClick={() => {
            setForm({ mode: "create" });
            setFormError(null);
          }}
          type="button"
        >
          <Plus className="size-4" />
          Crear organización
        </Button>
      </div>

      {actionError ? (
        <ErrorState
          actionLabel="Reintentar"
          error={new Error(actionError)}
          onRetry={refresh}
          title="No se pudieron cargar las organizaciones"
        />
      ) : null}
      {form ? (
        <OrganizationForm
          error={formError}
          form={form}
          onCancel={() => setForm(null)}
          onSubmit={submit}
          pending={pending}
        />
      ) : null}

      {!actionError && organizations.length === 0 ? (
        <div className="rounded-lg border border-border bg-card shadow-sm">
          <EmptyState
            className="border-0 shadow-none"
            description={
              initialFilters.search ||
              initialFilters.status ||
              initialFilters.type
                ? "No hay organizaciones con estos filtros."
                : "Crea la primera organización para comenzar."
            }
            title={
              initialFilters.search ||
              initialFilters.status ||
              initialFilters.type
                ? "Sin resultados"
                : "Sin organizaciones"
            }
          />
        </div>
      ) : null}

      {!actionError && organizations.length > 0 ? (
        <div className="rounded-lg border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <Table className="min-w-[1050px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                    Nombre
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                    Código
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                    Slug
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                    Tipo
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                    Estado
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                    Zona horaria
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                    Actualizado
                  </TableHead>
                  <TableHead className="w-20 px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((organization) => {
                  const id = idOf(organization);
                  const isPending = pendingId === id;
                  return (
                    <TableRow className="hover:bg-muted/60" key={id}>
                      <TableCell className="px-4 py-3 font-semibold">
                        <Link
                          className="hover:text-primary hover:underline"
                          href={localizedHref(
                            locale,
                            `/access/organizations/${id}`
                          )}
                        >
                          {organization.name}
                        </Link>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm">
                        {organization.code}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm">
                        {organization.slug}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm">
                        {organization.type || "No disponible"}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <OrganizationStatusBadge status={organization.status} />
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm">
                        {organization.timezone || "No disponible"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                        {dateLabel(organization.updatedAt)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            aria-label={`Acciones de ${organization.name}`}
                            className="inline-flex size-8 items-center justify-center rounded-md border border-border bg-background outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
                            disabled={isPending}
                            type="button"
                          >
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem
                              className="min-h-8 cursor-pointer gap-2 px-2"
                              onClick={() => {
                                setForm({ mode: "edit", organization });
                                setFormError(null);
                              }}
                            >
                              <Pencil className="size-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="min-h-8 cursor-pointer px-2"
                              onClick={() => confirmAction(id, "activate")}
                            >
                              Activar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="min-h-8 cursor-pointer px-2"
                              onClick={() => confirmAction(id, "suspend")}
                            >
                              Suspender
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="min-h-8 cursor-pointer px-2 text-destructive focus:text-destructive"
                              onClick={() => confirmAction(id, "archive")}
                            >
                              Archivar
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
