"use client";
import { applies } from "./connections-model";
import { SystemClientsForm } from "./system-clients-form";
import Link from "next/link";
import { SystemServicesForm } from "./system-services-form";
import { Braces, Code2, Info, ListChecks, Network } from "lucide-react";
import { Card } from "@/components/zuno/card";
import { Switch } from "@/components/zuno/switch";
import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/zuno/button";
import { Input } from "@/components/zuno/input";
import { Field, ConfigurationField, textareaClass } from "./catalog-fields";
import {
  readConfiguration,
  type Capability,
  type CatalogChoices,
  type System,
  type SystemDraft,
} from "./types";
export function SystemForm({
  system,
  capabilities,
  choices,
  onSave,
  cancelHref,
  identityClientsHref,
}: {
  system?: System;
  capabilities: Capability[];
  choices: CatalogChoices;
  onSave: (value: SystemDraft) => Promise<void>;
  cancelHref: string;
  identityClientsHref?: string;
}) {
  const [value, setValue] = useState<SystemDraft>(
    () =>
      system ?? {
        code: "",
        name: "",
        enabled: true,
        configuration: {},
        services: [],
        clients: [],
      },
  );
  const [json, setJson] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [creatingClient, setCreatingClient] = useState(false);
  const [pendingSecret, setPendingSecret] = useState(false);
  const busy = saving || creatingClient;
  const submitting = useRef(false);
  function update(next: Partial<SystemDraft>) {
    setValue((v) => ({ ...v, ...next }));
  }
  function configure(code: string, key: string, next: unknown) {
    setValue((v) => ({
      ...v,
      configuration: {
        ...v.configuration,
        [code]: { ...v.configuration[code], [key]: next },
      },
    }));
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (submitting.current || creatingClient || pendingSecret) return;
    setError("");
    try {
      const configuration =
        json === null ? value.configuration : readConfiguration(json);
      submitting.current = true;
      setSaving(true);
      await onSave({
        code: value.code,
        name: value.name,
        enabled: value.enabled,
        configuration,
        services: value.services,
        clients: value.clients.map((c) => ({
          capabilityCode: c.capabilityCode,
          oauthIssuer: c.oauthIssuer,
          clientId: c.clientId,
          roles: c.roles,
          enabled: c.enabled,
        })),
      });
    } catch (cause) {
      setError(
        cause instanceof SyntaxError
          ? "El JSON no es válido. Revisa su formato antes de continuar."
          : cause instanceof Error
            ? cause.message
            : "No se pudo guardar el sistema.",
      );
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }
  let activeConfiguration = value.configuration;
  if (json !== null) {
    try {
      activeConfiguration = readConfiguration(json);
    } catch {
      /* Keep the previous configuration while JSON is incomplete. */
    }
  }
  function addService() {
    const index = value.services.length;
    if (index >= 100) return;
    update({
      services: [
        ...value.services,
        {
          code: "",
          name: "",
          url: "",
          enabled: true,
          audience: "",
          resource: "",
        },
      ],
    });
    requestAnimationFrame(() => {
      const input = document.getElementById(`service-${index}-name`);
      input?.scrollIntoView({ block: "center" });
      input?.focus();
    });
  }
  const serviceUsage = Object.fromEntries(
    value.services.map((service) => [
      service.code,
      capabilities
        .filter((capability) =>
          capability.schema.fields.some(
            (field) =>
              field.format === "service" &&
              activeConfiguration[capability.code]?.[field.key] ===
                service.code,
          ),
        )
        .map((capability) => capability.name),
    ]),
  );
  return (
    <form
      onSubmit={(event) => void submit(event)}
      className="space-y-6"
      aria-busy={busy}
    >
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <fieldset disabled={busy} className="min-w-0 space-y-6">
        <legend className="sr-only">Configuración del sistema</legend>
        <Card className="space-y-5 p-5 sm:p-6">
          <div className="space-y-1">
            <h2 className="flex items-center gap-2 text-base font-semibold text-heading">
              <Network
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              Datos generales
            </h2>
            <p className="text-sm text-muted-foreground">
              Identifica el sistema y define si estará disponible.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <Field id="system-name" label="Nombre">
              <Input
                id="system-name"
                className="h-10"
                autoFocus
                required
                maxLength={200}
                placeholder="Nombre del sistema"
                value={value.name}
                onChange={(event) => update({ name: event.target.value })}
              />
            </Field>
            <Field
              id="system-code"
              label="Código"
              help={
                system
                  ? "Identificador fijo. No se puede modificar después de crear el sistema."
                  : "Minúsculas, números, guiones o guiones bajos."
              }
            >
              <Input
                id="system-code"
                className="h-10 font-mono read-only:bg-muted/50 read-only:text-muted-foreground"
                aria-describedby="system-code-help"
                required
                pattern="[a-z][a-z0-9_-]{1,79}"
                maxLength={80}
                readOnly={Boolean(system)}
                placeholder="codigo_del_sistema"
                value={value.code}
                onChange={(event) => update({ code: event.target.value })}
              />
            </Field>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 p-4">
            <div className="space-y-1">
              <label
                htmlFor="system-enabled"
                className="block text-sm font-medium"
              >
                Sistema habilitado
              </label>
              <p className="text-xs text-muted-foreground">
                Disponible para utilizar sus capacidades configuradas.
              </p>
            </div>
            <Switch
              id="system-enabled"
              checked={value.enabled}
              disabled={busy}
              onCheckedChange={(enabled) => update({ enabled })}
            />
          </div>
        </Card>
        <SystemServicesForm
          services={value.services}
          usage={serviceUsage}
          audiences={choices.audiences}
          disabled={busy}
          onAddService={addService}
          onChange={(services) => update({ services })}
        />
        <Card className="min-w-0 overflow-hidden">
          <div className="space-y-1 border-b border-border p-5 sm:p-6">
            <h2
              id="system-capabilities"
              className="flex items-center gap-2 text-base font-semibold text-heading"
            >
              <Braces
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              Capacidades
            </h2>
            <p className="text-sm text-muted-foreground">
              Activa las funciones del sistema y completa los campos de cada
              capacidad.
            </p>
          </div>
          <div
            className="space-y-5 p-5 sm:p-6"
            aria-labelledby="system-capabilities"
          >
            <div
              role="group"
              aria-label="Vista de la configuración"
              className="flex w-fit max-w-full flex-wrap gap-1 rounded-lg bg-muted p-1"
            >
              <Button
                type="button"
                variant="ghost"
                aria-pressed={json === null}
                className={
                  json === null
                    ? "min-h-10 bg-card shadow-xs"
                    : "min-h-10 text-muted-foreground"
                }
                onClick={() => {
                  try {
                    if (json !== null)
                      update({ configuration: readConfiguration(json) });
                    setJson(null);
                    setError("");
                  } catch (cause) {
                    setError(
                      cause instanceof SyntaxError
                        ? "El JSON no es válido. Revisa su formato antes de continuar."
                        : cause instanceof Error
                          ? cause.message
                          : "JSON inválido.",
                    );
                  }
                }}
              >
                <ListChecks className="size-4" aria-hidden="true" />
                Formulario
              </Button>
              <Button
                type="button"
                variant="ghost"
                aria-pressed={json !== null}
                className={
                  json !== null
                    ? "min-h-10 bg-card shadow-xs"
                    : "min-h-10 text-muted-foreground"
                }
                onClick={() => {
                  if (json === null)
                    setJson(JSON.stringify(value.configuration, null, 2));
                }}
              >
                <Code2 className="size-4" aria-hidden="true" />
                JSON avanzado
              </Button>
            </div>
            {json !== null ? (
              <Field
                id="system-json"
                label="Configuración JSON"
                help="Esta vista edita la misma configuración del formulario. Se aplican las mismas validaciones al guardar."
              >
                <textarea
                  id="system-json"
                  className={`${textareaClass} min-h-72 resize-y leading-6`}
                  aria-describedby="system-json-help"
                  spellCheck={false}
                  value={json}
                  onChange={(event) => setJson(event.target.value)}
                  maxLength={50000}
                />
              </Field>
            ) : capabilities.length ? (
              capabilities.map((capability) => {
                const active = Object.hasOwn(
                  value.configuration,
                  capability.code,
                );
                return (
                  <section
                    key={capability.code}
                    aria-labelledby={`capability-${capability.code}`}
                    className={`min-w-0 rounded-lg border ${active ? "border-primary/20" : "border-border"}`}
                  >
                    <div
                      className={`flex items-center justify-between gap-4 rounded-t-lg p-4 sm:p-5 ${active ? "bg-primary/5" : ""}`}
                    >
                      <div className="min-w-0 space-y-1">
                        <label
                          id={`capability-${capability.code}`}
                          htmlFor={`enable-${capability.code}`}
                          className="block break-words text-sm font-semibold"
                        >
                          {capability.name}
                        </label>
                        <p className="break-all font-mono text-xs text-muted-foreground">
                          {capability.code}
                        </p>
                        {!active && (
                          <p className="text-xs text-muted-foreground">
                            Activa esta capacidad para completar su
                            configuración.
                          </p>
                        )}
                      </div>
                      <Switch
                        id={`enable-${capability.code}`}
                        checked={active}
                        disabled={busy}
                        onCheckedChange={(checked) => {
                          const configuration = { ...value.configuration };
                          if (checked)
                            configuration[capability.code] = Object.fromEntries(
                              capability.schema.fields
                                .filter((field) => field.type === "boolean")
                                .map((field) => [field.key, false]),
                            );
                          else delete configuration[capability.code];
                          update({ configuration });
                        }}
                      />
                    </div>
                    {active && (
                      <div className="grid gap-5 border-t border-primary/20 p-4 sm:p-5 md:grid-cols-2">
                        {capability.schema.fields
                          .filter((field) =>
                            applies(
                              field,
                              value.clients
                                .filter(
                                  (client) =>
                                    client.enabled &&
                                    client.capabilityCode === capability.code,
                                )
                                .flatMap((client) => client.roles),
                            ),
                          )
                          .map((field) => (
                            <ConfigurationField
                              key={field.key}
                              id={`config-${capability.code}-${field.key}`}
                              field={field}
                              value={
                                value.configuration[capability.code]?.[
                                  field.key
                                ]
                              }
                              onChange={(next) =>
                                configure(capability.code, field.key, next)
                              }
                              services={value.services}
                              onAddService={addService}
                              addServiceDisabled={
                                busy || value.services.length >= 100
                              }
                            />
                          ))}
                      </div>
                    )}
                  </section>
                );
              })
            ) : (
              <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                No hay capacidades registradas. Puedes crearlas en Catálogos →
                Capacidades.
              </p>
            )}
          </div>
          <div className="flex items-start gap-3 border-t border-border bg-muted/30 p-5 text-sm text-muted-foreground sm:px-6">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>
              Los campos y las validaciones se definen en el esquema de cada
              capacidad.
            </p>
          </div>
        </Card>
        <SystemClientsForm
          clients={value.clients}
          capabilities={capabilities}
          configuration={activeConfiguration}
          choices={choices}
          systemCode={value.code}
          disabled={busy}
          identityClientsHref={identityClientsHref}
          onChange={(clients) => update({ clients })}
          onBusyChange={setCreatingClient}
          onSecretPending={setPendingSecret}
        />
      </fieldset>
      <div className="sticky bottom-4 z-10 flex flex-col-reverse gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
          <Network className="size-4 shrink-0" aria-hidden="true" />
          {pendingSecret
            ? "Guarda el secreto y cierra su panel para continuar."
            : "Los cambios se validarán antes de guardarse."}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button
            type="button"
            variant="outline"
            className="min-h-10"
            disabled={busy}
            render={<Link href={cancelHref} />}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="min-h-10"
            disabled={busy || pendingSecret}
            loading={saving}
          >
            Guardar sistema
          </Button>
        </div>
      </div>
    </form>
  );
}
