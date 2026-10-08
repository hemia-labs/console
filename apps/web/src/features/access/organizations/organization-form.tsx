"use client";

import { useState } from "react";

import { Button } from "@/components/zuno/button";
import { Input } from "@/components/zuno/input";
import { Textarea } from "@/components/ui/textarea";
import type {
  AccessOrganization,
  CreateOrganizationPayload,
  OrganizationFormPayload,
  UpdateOrganizationPayload,
} from "./types";

type FormState =
  | { mode: "create"; organization?: undefined }
  | { mode: "edit"; organization: AccessOrganization };

function initialValue(organization?: AccessOrganization) {
  return {
    code: organization?.code ?? "",
    countryCode: organization?.countryCode ?? "",
    legalName: organization?.legalName ?? "",
    metadata: organization?.metadata
      ? JSON.stringify(organization.metadata, null, 2)
      : "",
    name: organization?.name ?? "",
    slug: organization?.slug ?? "",
    status: organization?.status === "suspended" ? "suspended" : "active",
    timezone: organization?.timezone ?? "",
    type: organization?.type ?? "",
  };
}

export function OrganizationForm({
  error,
  form,
  onCancel,
  onSubmit,
  pending = false,
}: {
  error?: string | null;
  form: FormState;
  onCancel: () => void;
  onSubmit: (payload: OrganizationFormPayload) => Promise<void>;
  pending?: boolean;
}) {
  const [value, setValue] = useState(() => initialValue(form.organization));
  const [metadataError, setMetadataError] = useState<string | null>(null);

  function update(key: keyof typeof value, next: string) {
    setValue((current) => ({ ...current, [key]: next }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMetadataError(null);

    let metadata: Record<string, unknown> | undefined;
    if (value.metadata.trim()) {
      try {
        const parsed: unknown = JSON.parse(value.metadata);
        if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
          throw new Error("Metadata debe ser un objeto JSON.");
        }
        metadata = parsed as Record<string, unknown>;
      } catch {
        setMetadataError("Metadata debe contener un objeto JSON válido.");
        return;
      }
    }

    if (form.mode === "create") {
      const payload: CreateOrganizationPayload = {
        code: value.code.trim(),
        countryCode: value.countryCode.trim() || undefined,
        legalName: value.legalName.trim() || undefined,
        metadata,
        name: value.name.trim(),
        slug: value.slug.trim(),
        status: value.status as CreateOrganizationPayload["status"],
        timezone: value.timezone.trim() || undefined,
        type: value.type.trim() || undefined,
      };
      await onSubmit(payload);
      return;
    }

    const payload: UpdateOrganizationPayload = {
      legalName: value.legalName.trim() || undefined,
      metadata,
      name: value.name.trim() || undefined,
      timezone: value.timezone.trim() || undefined,
    };
    await onSubmit(payload);
  }

  const create = form.mode === "create";

  return (
    <form className="rounded-lg border border-border bg-card p-5 shadow-sm" onSubmit={submit}>
      <h2 className="text-lg font-semibold">{create ? "Crear organización" : "Editar organización"}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Los cambios se aplican directamente en Hemia Access.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {create ? (
          <label className="grid gap-2 text-sm font-medium">
            Código
            <Input className="h-8 bg-card" onChange={(event) => update("code", event.target.value)} required value={value.code} />
          </label>
        ) : null}
        <label className="grid gap-2 text-sm font-medium">
          Nombre
          <Input className="h-8 bg-card" onChange={(event) => update("name", event.target.value)} required value={value.name} />
        </label>
        {create ? (
          <label className="grid gap-2 text-sm font-medium">
            Slug
            <Input className="h-8 bg-card" onChange={(event) => update("slug", event.target.value)} required value={value.slug} />
          </label>
        ) : null}
        <label className="grid gap-2 text-sm font-medium">
          Razón social
          <Input className="h-8 bg-card" onChange={(event) => update("legalName", event.target.value)} value={value.legalName} />
        </label>
        {create ? (
          <>
            <label className="grid gap-2 text-sm font-medium">
              Tipo
              <Input className="h-8 bg-card" onChange={(event) => update("type", event.target.value)} value={value.type} />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              País
              <Input className="h-8 bg-card" maxLength={2} onChange={(event) => update("countryCode", event.target.value.toUpperCase())} value={value.countryCode} />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Estado inicial
              <select className="h-8 rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" onChange={(event) => update("status", event.target.value)} value={value.status}>
                <option value="active">Activa</option>
                <option value="suspended">Suspendida</option>
              </select>
            </label>
          </>
        ) : null}
        <label className="grid gap-2 text-sm font-medium">
          Zona horaria
          <Input className="h-8 bg-card" onChange={(event) => update("timezone", event.target.value)} placeholder="America/Mexico_City" value={value.timezone} />
        </label>
        <label className="grid gap-2 text-sm font-medium md:col-span-2">
          Metadata avanzada (JSON)
          <Textarea className="min-h-32 bg-card font-mono text-xs" onChange={(event) => update("metadata", event.target.value)} placeholder='{"plan":"enterprise"}' value={value.metadata} />
          <span className="text-xs text-muted-foreground">Opcional. Debe ser un objeto JSON válido.</span>
        </label>
      </div>

      {metadataError ? <p className="mt-4 text-sm font-medium text-destructive">{metadataError}</p> : null}
      {error ? <p className="mt-4 text-sm font-medium text-destructive" role="alert">{error}</p> : null}
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button className="h-8" disabled={pending} onClick={onCancel} type="button" variant="outline">Cancelar</Button>
        <Button className="h-8" disabled={pending} type="submit">{pending ? "Guardando..." : "Guardar"}</Button>
      </div>
    </form>
  );
}
