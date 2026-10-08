"use client";
import { useEffect, useRef, useState } from "react";
import { consoleApi, ConsoleApiError } from "@/lib/console-api";
import { Button } from "@/components/zuno/button";
import { CatalogPublication } from "./catalog-publication";
import {
  latestCatalogs,
  readCatalogs,
  type SystemRoleCatalog,
} from "./catalogs";

export function CatalogsClient() {
  const [catalogs, setCatalogs] = useState<SystemRoleCatalog[]>();
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const generation = useRef(0);
  useEffect(() => {
    const controller = new AbortController();
    const current = ++generation.current;
    consoleApi
      .get<unknown>("/access/system-role-catalogs", {
        signal: controller.signal,
        cache: "no-store",
      })
      .then((value) => {
        if (!controller.signal.aborted && current === generation.current) {
          setCatalogs(latestCatalogs(readCatalogs(value)));
          setError("");
        }
      })
      .catch((cause) => {
        if (!controller.signal.aborted && current === generation.current)
          setError(
            cause instanceof ConsoleApiError && cause.status === 403
              ? "Necesitas autoridad de administrador de plataforma para consultar los catálogos."
              : cause instanceof ConsoleApiError && cause.status === 401
                ? "Inicia sesión nuevamente para consultar los catálogos."
                : "No se pudo consultar el estado de publicación. Reintenta antes de publicar.",
          );
      });
    return () => controller.abort();
  }, [attempt]);
  if (error)
    return (
      <div className="space-y-4 rounded-xl border p-6">
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
        <Button
          variant="outline"
          onClick={() => {
            setError("");
            setCatalogs(undefined);
            setAttempt((value) => value + 1);
          }}
        >
          Reintentar consulta
        </Button>
      </div>
    );
  if (!catalogs)
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Consultando el estado de publicación…
      </p>
    );
  if (!catalogs.length)
    return (
      <p role="status" className="text-sm text-muted-foreground">
        No hay catálogos de sistema disponibles.
      </p>
    );
  return (
    <div className="grid items-start gap-5 md:grid-cols-2">
      {catalogs.map((catalog) => (
        <CatalogPublication
          key={`${catalog.productCode}:${catalog.version}`}
          catalog={catalog}
        />
      ))}
    </div>
  );
}
