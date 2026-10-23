"use client";
import { useState } from "react";
import { Input } from "@/components/zuno/input";
import { scopeKey, type OAuthScope, type ScopeReference } from "./types";
export function ScopePicker({
  id,
  scopes,
  value,
  onChange,
  disabled = false,
  requireResource = false,
}: {
  id: string;
  scopes: OAuthScope[];
  value: ScopeReference[];
  onChange: (refs: ScopeReference[]) => void;
  disabled?: boolean;
  requireResource?: boolean;
}) {
  const [query, setQuery] = useState("");
  const entries = scopes.filter((s) =>
    `${s.name} ${s.code} ${s.audience} ${s.description}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const missing = value.filter(
    (ref) => !scopes.some((s) => scopeKey(s) === scopeKey(ref)),
  );
  return (
    <div className="space-y-3">
      <Input
        id={id}
        type="search"
        className="h-10"
        aria-label="Buscar permisos"
        placeholder="Buscar por nombre, scope o API"
        value={query}
        disabled={disabled}
        onChange={(e) => setQuery(e.target.value)}
      />
      <p className="text-xs text-muted-foreground">
        {value.length} seleccionados · {entries.length} resultados
      </p>
      <div
        className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-border p-2"
        role="group"
        aria-label="Permisos disponibles"
      >
        {entries.slice(0, 100).map((scope) => {
          const selected = value.some(
            (ref) => scopeKey(ref) === scopeKey(scope),
          );
          return (
            <label
              key={scope.id}
              className="flex min-h-10 items-start gap-3 rounded-md p-2 hover:bg-muted/40"
            >
              <input
                type="checkbox"
                className="mt-1 size-4 shrink-0 accent-primary"
                checked={selected}
                disabled={
                  disabled ||
                  ((!scope.enabled || (requireResource && !scope.resource)) &&
                    !selected)
                }
                onChange={(e) =>
                  onChange(
                    e.target.checked
                      ? [
                          ...value,
                          { audience: scope.audience, code: scope.code },
                        ]
                      : value.filter(
                          (ref) => scopeKey(ref) !== scopeKey(scope),
                        ),
                  )
                }
              />
              <span className="min-w-0 text-sm">
                <span className="block break-words font-medium">
                  {scope.name}
                  {!scope.enabled
                    ? " · Deshabilitado"
                    : requireResource && !scope.resource
                      ? " · Configura la URL de la API"
                      : ""}
                </span>
                <span className="block break-all font-mono text-xs text-muted-foreground">
                  {scope.name !== scope.code && (
                    <>
                      {scope.code}
                      {" · "}
                    </>
                  )}
                  {scope.audience}
                </span>
                {scope.description && (
                  <span className="block text-xs text-muted-foreground">
                    {scope.description}
                  </span>
                )}
              </span>
            </label>
          );
        })}
        {!entries.length && (
          <p className="p-3 text-sm text-muted-foreground" role="status">
            No hay permisos que coincidan con la búsqueda.
          </p>
        )}
        {entries.length > 100 && (
          <p className="p-2 text-xs text-muted-foreground">
            Se muestran los primeros 100. Afina la búsqueda para encontrar otros
            permisos.
          </p>
        )}
      </div>
      {missing.map((ref) => (
        <label
          key={scopeKey(ref)}
          className="flex min-h-10 items-center gap-3 text-sm text-destructive"
        >
          <input
            type="checkbox"
            checked
            disabled={disabled}
            onChange={() =>
              onChange(value.filter((s) => scopeKey(s) !== scopeKey(ref)))
            }
          />
          {ref.code} · {ref.audience} (no registrado)
        </label>
      ))}
    </div>
  );
}
