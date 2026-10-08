"use client";

import {
  ArrowLeft,
  Archive,
  CheckCircle2,
  Pencil,
  PauseCircle,
} from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

import { ConfirmAction } from "@/components/confirm-action";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/zuno/button";
import { Separator } from "@/components/ui/separator";
import { apiErrorMessage } from "@/features/identity-access/components/identity-api-error";
import { localizedHref } from "@/lib/nav";
import { changeOrganizationStatus, updateOrganization } from "./api";
import { OrganizationForm } from "./organization-form";
import { OrganizationProductsSection } from "./organization-products-section";
import { OrganizationStatusBadge } from "./organization-status-badge";
import type {
  AccessOrganization,
  AccessProduct,
  OrganizationFormPayload,
  OrganizationProduct,
} from "./types";

function dateLabel(value?: string | null) {
  if (!value) return "No disponible";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("es-MX");
}

const futureTabs = ["Memberships", "Roles y permisos", "Invitations"];

export function OrganizationDetailClient({
  initialError,
  onRefresh,
  locale,
  organization,
  organizationProducts,
  organizationProductsError,
  products,
  productsError,
}: {
  initialError?: string | null;
  onRefresh: () => void;
  locale: string;
  organization: AccessOrganization;
  organizationProducts: OrganizationProduct[];
  organizationProductsError?: string | null;
  products: AccessProduct[];
  productsError?: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [pending, startTransition] = useTransition();

  function refresh() {
    startTransition(() => {
      setError(null);
      onRefresh();
    });
  }

  async function submit(payload: OrganizationFormPayload) {
    setError(null);
    try {
      await updateOrganization(organization.id, payload);
      setEditing(false);
      refresh();
    } catch (actionError) {
      setError(apiErrorMessage(actionError));
    }
  }

  function runStatusAction(action: "activate" | "archive" | "suspend") {
    void (async () => {
      try {
        await changeOrganizationStatus(organization.id, action);
        refresh();
      } catch (actionError) {
        setError(apiErrorMessage(actionError));
      }
    })();
  }

  const metadata = organization.metadata
    ? JSON.stringify(organization.metadata, null, 2)
    : "Sin metadata";

  return (
    <div className="space-y-5">
      {error ? (
        <ErrorState
          error={new Error(error)}
          onRetry={refresh}
          title="No se pudo actualizar la organización"
        />
      ) : null}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <Link
          className="inline-flex h-8 items-center gap-2 text-sm font-semibold text-primary hover:underline"
          href={localizedHref(locale, "/access/organizations")}
        >
          <ArrowLeft className="size-4" />
          Volver a organizaciones
        </Link>
        <div className="flex flex-wrap gap-2">
          <Button
            className="h-8"
            disabled={pending}
            onClick={() => setEditing((value) => !value)}
            type="button"
            variant="outline"
          >
            <Pencil className="size-4" />
            {editing ? "Cancelar edición" : "Editar"}
          </Button>
          <ConfirmAction
            disabled={pending}
            onConfirm={() => runStatusAction("activate")}
            confirmMessage="¿Quieres activar esta organización?"
            variant="secondary"
          >
            <CheckCircle2 className="size-4" />
            Activar
          </ConfirmAction>
          <ConfirmAction
            disabled={pending}
            onConfirm={() => runStatusAction("suspend")}
            confirmMessage="¿Quieres suspender esta organización?"
            variant="outline"
          >
            <PauseCircle className="size-4" />
            Suspender
          </ConfirmAction>
          <ConfirmAction
            disabled={pending}
            onConfirm={() => runStatusAction("archive")}
            confirmMessage="Esta acción archivará la organización. ¿Continuar?"
            variant="destructive"
          >
            <Archive className="size-4" />
            Archivar
          </ConfirmAction>
        </div>
      </div>

      {editing ? (
        <OrganizationForm
          error={error}
          form={{ mode: "edit", organization }}
          onCancel={() => setEditing(false)}
          onSubmit={submit}
          pending={pending}
        />
      ) : null}

      <section className="rounded-lg border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Organización</p>
            <h2 className="mt-1 text-xl font-bold">{organization.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {organization.code} · {organization.slug}
            </p>
          </div>
          <OrganizationStatusBadge status={organization.status} />
        </div>
        <Separator />
        <dl className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs text-muted-foreground">Tipo</dt>
            <dd className="mt-1 text-sm font-medium">
              {organization.type || "No disponible"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Razón social</dt>
            <dd className="mt-1 text-sm font-medium">
              {organization.legalName || "No disponible"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">País</dt>
            <dd className="mt-1 text-sm font-medium">
              {organization.countryCode || "No disponible"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Zona horaria</dt>
            <dd className="mt-1 text-sm font-medium">
              {organization.timezone || "No disponible"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Versión</dt>
            <dd className="mt-1 text-sm font-medium">
              {organization.version ?? "No disponible"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Creada</dt>
            <dd className="mt-1 text-sm font-medium">
              {dateLabel(organization.createdAt)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Actualizada</dt>
            <dd className="mt-1 text-sm font-medium">
              {dateLabel(organization.updatedAt)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Archivada</dt>
            <dd className="mt-1 text-sm font-medium">
              {dateLabel(organization.archivedAt)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-border bg-card shadow-sm">
        <div className="border-b border-border p-5">
          <h2 className="text-base font-semibold">
            Módulos de la organización
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Administra los recursos relacionados desde este contexto.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 p-5">
          <Button className="h-8" type="button">
            Overview
          </Button>
          {futureTabs.map((tab) => (
            <Button
              className="h-8"
              disabled
              key={tab}
              type="button"
              variant="outline"
            >
              {tab}
            </Button>
          ))}
        </div>
        <EmptyState
          className="mx-5 mb-5"
          description="Los módulos dependientes estarán disponibles en las siguientes fases."
          title="Overview de organización"
        />
      </section>

      <OrganizationProductsSection
        organizationProductsError={organizationProductsError}
        onRefresh={refresh}
        organizationId={organization.id}
        organizationProducts={organizationProducts}
        products={products}
        productsError={productsError}
      />

      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold">Metadata avanzada</h2>
        <pre className="mt-3 overflow-x-auto rounded-md bg-muted p-4 text-xs text-supporting">
          {metadata}
        </pre>
      </section>
    </div>
  );
}
