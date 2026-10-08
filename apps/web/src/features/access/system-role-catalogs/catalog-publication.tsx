"use client";
import { useEffect, useRef, useState } from "react";
import {
  CreditCard,
  ScrollText,
  CheckCircle2,
  ChevronDown,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/zuno/badge";
import { Card } from "@/components/zuno/card";
import { isCatalogPublication, type SystemRoleCatalog } from "./catalogs";
import { Button } from "@/components/zuno/button";
import { consoleApi } from "@/lib/console-api";
import { ConsoleApiError } from "@/lib/console-api.types";

type Publication = {
  catalogVersion: number;
  replayed: boolean;
  roles: { id: string; code: string }[];
};
export function CatalogPublication({
  catalog,
}: {
  catalog: SystemRoleCatalog;
}) {
  const Icon =
    catalog.productCode === "billing"
      ? CreditCard
      : catalog.productCode === "legal"
        ? ScrollText
        : Layers;
  const headingId = `${catalog.productCode}-catalog-title`;
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Publication>();
  const [conflict, setConflict] = useState(false);
  const published =
    catalog.publicationStatus === "published" || Boolean(result);
  const requiresReview = conflict || catalog.publicationStatus === "conflict";
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const mounted = useRef(true);
  const pending = useRef<AbortController | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      pending.current?.abort();
    };
  }, []);
  async function publish() {
    if (
      inFlight.current ||
      published ||
      requiresReview ||
      catalog.publicationStatus !== "pending"
    )
      return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    pending.current = new AbortController();
    try {
      const value = await consoleApi.post<Publication>(
        `/access/system-role-catalogs/${catalog.productCode}/v${catalog.version}`,
        {},
        { signal: pending.current.signal },
      );
      if (!isCatalogPublication(value, catalog))
        throw new Error("Invalid catalog response");
      if (mounted.current) setResult(value);
    } catch (cause) {
      if (
        mounted.current &&
        cause instanceof ConsoleApiError &&
        cause.status === 409
      )
        setConflict(true);
      if (mounted.current)
        setError(
          cause instanceof ConsoleApiError && cause.status === 401
            ? "Inicia sesión nuevamente para publicar."
            : cause instanceof ConsoleApiError && cause.status === 403
              ? "Necesitas el rol platform_super_admin vigente."
              : cause instanceof ConsoleApiError && cause.status === 409
                ? "El catálogo almacenado difiere de esta versión. Requiere revisión."
                : cause instanceof ConsoleApiError && cause.status === 429
                  ? "Espera un momento antes de reintentar."
                  : "No se pudo publicar. Puedes reintentar; la publicación es idempotente.",
        );
    } finally {
      inFlight.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  return (
    <Card className="flex flex-col overflow-hidden">
      <section
        aria-labelledby={headingId}
        aria-busy={busy}
        className="flex flex-col"
      >
        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border bg-muted text-foreground">
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 id={headingId} className="text-lg font-semibold">
                  {catalog.name}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Catálogo de roles
                </p>
              </div>
            </div>
            <Badge variant="outline" className="shrink-0">
              Versión {catalog.version}
            </Badge>
          </div>
          <p className="min-h-10 text-sm leading-6 text-muted-foreground">
            Roles y alcances definidos por el sistema.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{catalog.roles.length} roles</Badge>
            <span className="text-xs text-muted-foreground">
              {published
                ? "Publicado"
                : requiresReview
                  ? "Requiere revisión"
                  : catalog.publicationStatus === "unavailable"
                    ? "Sistema no habilitado"
                    : "Pendiente de publicación"}
            </span>
          </div>
          <details className="group rounded-lg border">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring">
              Ver roles y alcances
              <ChevronDown
                className="size-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </summary>
            <div className="space-y-4 border-t p-4">
              <p className="text-xs leading-5 text-muted-foreground">
                Consulta los alcances admitidos por cada rol.
              </p>
              <ul className="space-y-3">
                {catalog.roles.map((role) => (
                  <li key={role.code} className="space-y-1">
                    <p className="text-sm font-medium">{role.name}</p>
                    <p className="break-all font-mono text-xs text-muted-foreground">
                      {role.code}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {role.allowedScopes
                        .map((scope) =>
                          scope.consumer === "not_applicable"
                            ? scope.resource
                            : `${scope.resource} · ${scope.consumer}`,
                        )
                        .join(", ")}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        </div>
        <div className="mt-auto space-y-3 border-t bg-muted/30 p-5 sm:p-6">
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          {published ? (
            <div role="status" className="flex items-start gap-2 text-sm">
              <CheckCircle2
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              <div className="space-y-1">
                <p className="font-medium">
                  {result && !result.replayed
                    ? "Catálogo publicado correctamente"
                    : "Publicado"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {catalog.roles.length} roles registrados en Access.
                </p>
              </div>
            </div>
          ) : requiresReview || catalog.publicationStatus === "unavailable" ? (
            <p role="status" className="text-sm text-muted-foreground">
              {requiresReview
                ? "La definición almacenada requiere revisión antes de continuar."
                : "Activa el producto en Access antes de publicar."}
            </p>
          ) : (
            <Button
              size="lg"
              className="w-full"
              loading={busy}
              disabled={busy}
              onClick={() => void publish()}
            >
              {busy
                ? "Publicando…"
                : `Publicar ${catalog.name} v${catalog.version}`}
            </Button>
          )}
          <p className="text-xs leading-5 text-muted-foreground">
            Publicar registra la versión. Las asignaciones a operadores se
            realizan por separado.
          </p>
        </div>
      </section>
    </Card>
  );
}
