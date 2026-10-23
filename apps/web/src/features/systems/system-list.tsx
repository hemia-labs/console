import Link from "next/link";
import { Braces, ChevronRight, KeyRound, Network } from "lucide-react";
import { Badge } from "@/components/zuno/badge";
import { Button } from "@/components/zuno/button";
import { Card } from "@/components/zuno/card";
import { StatusBadge } from "@/components/zuno/status-badge";
import { EmptyState } from "@/components/empty-state";
import type { Capability, System } from "./types";

export function SystemList({
  systems,
  capabilities,
  listHref,
}: {
  systems: System[];
  capabilities: Capability[];
  listHref: string;
}) {
  if (!systems.length)
    return (
      <EmptyState
        icon={<Network className="size-5" aria-hidden="true" />}
        title="No hay sistemas registrados"
        description="Crea un sistema para configurar sus capacidades y los clientes que podrán utilizarlo."
      />
    );
  return (
    <section aria-labelledby="systems-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="systems-heading" className="text-sm font-semibold">
          Sistemas registrados
        </h2>
        <p className="text-sm text-muted-foreground">
          {systems.length} {systems.length === 1 ? "sistema" : "sistemas"}
        </p>
      </div>
      <div className="grid items-stretch gap-5 lg:grid-cols-2">
        {systems.map((system) => {
          const capabilityCodes = Object.keys(system.configuration);
          const enabledClients = system.clients.filter(
            (client) => client.enabled,
          );
          return (
            <Card
              key={system.id}
              className="flex min-w-0 flex-col overflow-hidden"
            >
              <div className="flex-1 space-y-6 p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Network className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 space-y-1">
                      <h3 className="break-words text-base font-semibold text-heading">
                        {system.name}
                      </h3>
                      <p className="break-all font-mono text-xs text-muted-foreground">
                        {system.code}
                      </p>
                    </div>
                  </div>
                  <StatusBadge
                    status={system.enabled ? "success" : "neutral"}
                    className="shrink-0"
                  >
                    {system.enabled ? "Habilitado" : "Deshabilitado"}
                  </StatusBadge>
                </div>
                <div className="space-y-3">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <Braces
                      className="size-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                    Capacidades
                  </p>
                  {capabilityCodes.length ? (
                    <div className="flex flex-wrap items-start gap-2">
                      {capabilityCodes.slice(0, 3).map((code) => (
                        <Badge
                          key={code}
                          variant="outline"
                          className="max-w-full break-all whitespace-normal"
                        >
                          {capabilities.find(
                            (capability) => capability.code === code,
                          )?.name ?? code}
                        </Badge>
                      ))}
                      {capabilityCodes.length > 3 && (
                        <Badge variant="secondary">
                          +{capabilityCodes.length - 3} más
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Sin capacidades configuradas.
                    </p>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p
                      id={`clients-${system.id}`}
                      className="flex items-center gap-2 text-sm font-medium"
                    >
                      <KeyRound
                        className="size-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                      Clientes autorizados
                    </p>
                    {system.clients.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {enabledClients.length} de {system.clients.length}{" "}
                        habilitados
                      </p>
                    )}
                  </div>
                  {system.clients.length ? (
                    <dl
                      aria-labelledby={`clients-${system.id}`}
                      className="grid grid-cols-2 divide-x divide-border rounded-lg border border-border bg-muted/30"
                    >
                      <div className="p-3">
                        <dt className="min-h-10 text-xs leading-5 text-muted-foreground">
                          Habilitados
                        </dt>
                        <dd className="mt-1 text-lg font-semibold tabular-nums">
                          {enabledClients.length}
                        </dd>
                      </div>
                      <div className="p-3">
                        <dt className="min-h-10 text-xs leading-5 text-muted-foreground">
                          Deshabilitados
                        </dt>
                        <dd className="mt-1 text-lg font-semibold tabular-nums">
                          {system.clients.length - enabledClients.length}
                        </dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                      Sin clientes configurados.
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-end border-t border-border bg-muted/30 px-5 py-3 sm:px-6">
                <Button
                  className="min-h-10 w-full sm:w-auto"
                  variant="outline"
                  aria-label={`Editar sistema ${system.name}`}
                  render={
                    <Link
                      href={`${listHref}/${encodeURIComponent(system.id)}/edit`}
                    />
                  }
                >
                  Editar sistema
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
