"use client";
import Link from "next/link";
import { useCallback, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ConsoleDataLoader } from "@/features/auth/console-data-loader";
import { Button } from "@/components/zuno/button";
import { Input } from "@/components/zuno/input";
import { Card } from "@/components/zuno/card";
import { Switch } from "@/components/zuno/switch";
import { Field, textareaClass } from "@/features/systems/catalog-fields";
import { getOAuthScopes, saveOAuthScope } from "./api";
import type { OAuthScope } from "./types";
export function ScopesCatalog({ listHref }: { listHref: string }) {
  const load = useCallback((signal: AbortSignal) => getOAuthScopes(signal), []);
  return (
    <ConsoleDataLoader
      load={load}
      title="No se pudo cargar el catálogo de scopes"
    >
      {(scopes) => <ScopeList scopes={scopes} listHref={listHref} />}
    </ConsoleDataLoader>
  );
}
function ScopeList({
  scopes,
  listHref,
}: {
  scopes: OAuthScope[];
  listHref: string;
}) {
  const [query, setQuery] = useState("");
  const visible = scopes.filter((s) =>
    `${s.code} ${s.name} ${s.audience} ${s.description}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <Card className="space-y-4 p-5 sm:p-6">
      <Input
        className="h-10"
        type="search"
        aria-label="Buscar scopes"
        placeholder="Buscar por nombre, código o API"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <p className="text-xs text-muted-foreground">
        {visible.length} permisos · El catálogo organiza los permisos; cada API
        debe implementarlos y validarlos.
      </p>
      <div className="divide-y divide-border">
        {visible.slice(0, 100).map((scope) => (
          <div
            key={scope.id}
            className="flex items-start justify-between gap-4 py-4"
          >
            <div className="min-w-0 space-y-1">
              <h2 className="break-words text-sm font-semibold">
                {scope.name}
              </h2>
              <p className="break-all font-mono text-xs text-muted-foreground">
                {scope.code} · {scope.audience}
              </p>
              {scope.description && (
                <p className="text-sm text-muted-foreground">
                  {scope.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {scope.enabled ? "Habilitado" : "Deshabilitado"} ·{" "}
                {scope.resource || "Sin URL de API para clientes de servicio"}
              </p>
            </div>
            <Button
              variant="outline"
              className="min-h-10 shrink-0"
              render={<Link href={`${listHref}/${scope.id}/edit`} />}
              aria-label={`Editar permiso ${scope.name}`}
            >
              Editar
            </Button>
          </div>
        ))}
      </div>
      {!visible.length && (
        <p role="status" className="text-sm text-muted-foreground">
          No hay permisos que coincidan. Agrega un permiso al catálogo para
          poder seleccionarlo.
        </p>
      )}
      {visible.length > 100 && (
        <p className="text-xs text-muted-foreground">
          Afina la búsqueda para ver más resultados.
        </p>
      )}
    </Card>
  );
}
export function ScopeEditor({
  id,
  listHref,
}: {
  id?: string;
  listHref: string;
}) {
  const load = useCallback(
    async (signal: AbortSignal) => {
      const scopes = await getOAuthScopes(signal);
      const scope = id ? scopes.find((s) => s.id === id) : undefined;
      if (id && !scope) throw new Error("Permiso no encontrado.");
      return scope;
    },
    [id],
  );
  return (
    <ConsoleDataLoader load={load} title="No se pudo cargar el permiso">
      {(scope) => (
        <ScopeForm key={scope?.id ?? "new"} scope={scope} listHref={listHref} />
      )}
    </ConsoleDataLoader>
  );
}
function ScopeForm({
  scope,
  listHref,
}: {
  scope?: OAuthScope;
  listHref: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState<Omit<OAuthScope, "id">>(
    () =>
      scope ?? {
        code: "",
        audience: "",
        name: "",
        description: "",
        resource: "",
        enabled: true,
      },
  );
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setPending(true);
    setError("");
    try {
      await saveOAuthScope(
        { ...value, resource: value.resource?.trim() || null },
        scope?.id,
      );
      router.replace(listHref);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo guardar el permiso.",
      );
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }
  return (
    <form
      onSubmit={(e) => void submit(e)}
      className="space-y-5"
      aria-busy={pending}
    >
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <fieldset disabled={pending}>
        <Card className="space-y-5 p-5 sm:p-6">
          <legend className="sr-only">Permiso OAuth</legend>
          <div className="grid gap-5 md:grid-cols-2">
            {(
              [
                { key: "name", label: "Nombre", max: 200 },
                { key: "code", label: "Código del scope", max: 160 },
                { key: "audience", label: "Audiencia de la API", max: 160 },
                { key: "resource", label: "URL de la API", max: 2048 },
              ] as const
            ).map((field) => (
              <Field
                key={field.key}
                id={`scope-${field.key}`}
                label={field.label}
                help={
                  field.key === "resource"
                    ? "Necesaria para crear clientes de servicio desde Sistemas."
                    : undefined
                }
              >
                <Input
                  id={`scope-${field.key}`}
                  className="h-10"
                  type={field.key === "resource" ? "url" : "text"}
                  required={field.key !== "resource"}
                  maxLength={field.max}
                  readOnly={!!scope && ["code", "audience"].includes(field.key)}
                  value={value[field.key] ?? ""}
                  onChange={(e) =>
                    setValue((current) => ({
                      ...current,
                      [field.key]: e.target.value,
                    }))
                  }
                />
              </Field>
            ))}
          </div>
          <Field id="scope-description" label="Descripción">
            <textarea
              id="scope-description"
              className={`${textareaClass} min-h-24 font-sans`}
              maxLength={2000}
              value={value.description}
              onChange={(e) =>
                setValue((current) => ({
                  ...current,
                  description: e.target.value,
                }))
              }
            />
          </Field>
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="scope-enabled" className="text-sm font-medium">
              Habilitado para nuevas asignaciones
            </label>
            <Switch
              id="scope-enabled"
              checked={value.enabled}
              disabled={pending}
              onCheckedChange={(enabled) =>
                setValue((current) => ({ ...current, enabled }))
              }
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Deshabilitarlo impide nuevas selecciones; los permisos de los
            clientes existentes se administran en Identity.
          </p>
        </Card>
      </fieldset>
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          type="button"
          disabled={pending}
          render={<Link href={listHref} />}
        >
          Cancelar
        </Button>
        <Button
          className="min-h-10"
          type="submit"
          disabled={pending}
          loading={pending}
        >
          Guardar permiso
        </Button>
      </div>
    </form>
  );
}
