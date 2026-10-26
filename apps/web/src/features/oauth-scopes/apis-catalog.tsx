"use client";
import { useCallback, useRef, useState, type FormEvent } from "react";
import { ConsoleDataLoader } from "@/features/auth/console-data-loader";
import { Button } from "@/components/zuno/button";
import { Card } from "@/components/zuno/card";
import { Input } from "@/components/zuno/input";
import { Switch } from "@/components/zuno/switch";
import { Field } from "@/features/systems/catalog-fields";
import { getOAuthApis, getOAuthScopes, saveOAuthApi } from "./api";
import { ScopePicker } from "./scope-picker";
import type { OAuthApi, OAuthScope } from "./types";
export function OAuthApisCatalog() {
  const [revision, setRevision] = useState(0);
  const load = useCallback(async (signal: AbortSignal) => {
    const [apis, scopes] = await Promise.all([
      getOAuthApis(signal),
      getOAuthScopes(signal),
    ]);
    return { apis, scopes };
  }, []);
  return (
    <ConsoleDataLoader
      key={revision}
      load={load}
      title="No se pudo cargar el catálogo de APIs"
    >
      {({ apis, scopes }) => (
        <ApiList
          apis={apis}
          scopes={scopes}
          onSaved={() => setRevision((r) => r + 1)}
        />
      )}
    </ConsoleDataLoader>
  );
}
function ApiList({
  apis,
  scopes,
  onSaved,
}: {
  apis: OAuthApi[];
  scopes: OAuthScope[];
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState<OAuthApi | null | undefined>();
  const [query, setQuery] = useState("");
  if (editing !== undefined)
    return (
      <ApiForm
        api={editing ?? undefined}
        scopes={scopes}
        onSaved={onSaved}
        onCancel={() => setEditing(undefined)}
      />
    );
  const visible = apis.filter((a) =>
    `${a.name} ${a.audience} ${a.resource ?? ""}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <Card className="space-y-4 p-5 sm:p-6">
      <div className="flex flex-wrap gap-3">
        <Input
          className="h-10 flex-1"
          aria-label="Buscar APIs"
          placeholder="Buscar API o audiencia"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button onClick={() => setEditing(null)}>Nueva API</Button>
      </div>
      <div className="divide-y divide-border">
        {visible.map((api) => (
          <div
            key={api.id}
            className="flex items-start justify-between gap-4 py-4"
          >
            <div className="min-w-0 space-y-1">
              <h2 className="text-sm font-semibold">{api.name}</h2>
              <p className="break-all font-mono text-xs text-muted-foreground">
                {api.audience} · {api.resource || "URL pendiente"}
              </p>
              <p className="text-xs text-muted-foreground">
                {api.enabled ? "Habilitada" : "Deshabilitada"} ·{" "}
                {api.scopes.length} permisos admitidos
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setEditing(api)}
              aria-label={`Editar API ${api.name}`}
            >
              Editar
            </Button>
          </div>
        ))}
      </div>
      {!visible.length && (
        <p role="status" className="text-sm text-muted-foreground">
          No hay APIs que coincidan.
        </p>
      )}
    </Card>
  );
}
function ApiForm({
  api,
  scopes,
  onSaved,
  onCancel,
}: {
  api?: OAuthApi;
  scopes: OAuthScope[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState<Omit<OAuthApi, "id">>(() =>
    api
      ? {
          name: api.name,
          audience: api.audience,
          resource: api.resource,
          enabled: api.enabled,
          scopes: [...api.scopes],
        }
      : { name: "", audience: "", resource: "", enabled: true, scopes: [] },
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setPending(true);
    setError("");
    try {
      await saveOAuthApi(value, api?.id);
      onSaved();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "No se pudo guardar la API.",
      );
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }
  return (
    <form
      onSubmit={(e) => void submit(e)}
      aria-busy={pending}
      className="space-y-4"
    >
      <fieldset disabled={pending}>
        <Card className="space-y-5 p-5 sm:p-6">
          <legend className="sr-only">API OAuth</legend>
          {(
            [
              ["name", "Nombre"],
              ["audience", "Audiencia"],
              ["resource", "URL de la API"],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} id={`api-${key}`} label={label}>
              <Input
                id={`api-${key}`}
                className="h-10"
                required
                type={key === "resource" ? "url" : "text"}
                maxLength={
                  key === "resource" ? 2048 : key === "name" ? 200 : 160
                }
                readOnly={
                  !!api &&
                  (key === "audience" || (key === "resource" && !!api.resource))
                }
                value={value[key] ?? ""}
                onChange={(e) =>
                  setValue((v) => ({ ...v, [key]: e.target.value }))
                }
              />
            </Field>
          ))}
          <Field id="api-scopes" label="Scopes que admite esta API">
            <ScopePicker
              id="api-scopes"
              scopes={scopes
                .filter((s) => s.kind === "api")
                .map((s) => ({
                  ...s,
                  audience: value.audience,
                  resource: value.resource,
                }))}
              value={value.scopes.map((code) => ({
                code,
                audience: value.audience,
              }))}
              onChange={(refs) =>
                setValue((v) => ({ ...v, scopes: refs.map((s) => s.code) }))
              }
            />
          </Field>
          <div className="flex min-h-10 items-center justify-between gap-4">
            <label htmlFor="api-enabled" className="text-sm font-medium">
              Habilitada para nuevas asignaciones
            </label>
            <Switch
              id="api-enabled"
              checked={value.enabled}
              onCheckedChange={(enabled) =>
                setValue((v) => ({ ...v, enabled }))
              }
            />
          </div>
        </Card>
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button type="submit" loading={pending} disabled={pending}>
          Guardar API
        </Button>
      </div>
    </form>
  );
}
