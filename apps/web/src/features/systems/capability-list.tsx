import Link from "next/link";
import { Braces, ChevronRight, ListChecks } from "lucide-react";
import { Badge } from "@/components/zuno/badge";
import { Button } from "@/components/zuno/button";
import { Card } from "@/components/zuno/card";
import { EmptyState } from "@/components/empty-state";
import { capabilityFieldTypes, type Capability } from "./types";

export function CapabilityList({
  capabilities,
  listHref,
}: {
  capabilities: Capability[];
  listHref: string;
}) {
  if (!capabilities.length)
    return (
      <EmptyState
        icon={<Braces className="size-5" aria-hidden="true" />}
        title="Aún no hay capacidades"
        description="Crea una capacidad para definir los campos que se mostrarán al configurar un sistema."
      />
    );
  return (
    <section aria-labelledby="capabilities-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="capabilities-heading" className="text-sm font-semibold">
          Capacidades registradas
        </h2>
        <p className="text-sm text-muted-foreground">
          {capabilities.length}{" "}
          {capabilities.length === 1 ? "capacidad" : "capacidades"}
        </p>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-2">
        {capabilities.map((capability) => {
          const fields = capability.schema.fields;
          const required = fields.filter((field) => field.required).length;
          return (
            <Card key={capability.code} className="min-w-0 overflow-hidden">
              <div className="space-y-5 p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Braces className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 space-y-1">
                    <h3 className="break-words text-base font-semibold text-heading">
                      {capability.name}
                    </h3>
                    <p className="break-all font-mono text-xs text-muted-foreground">
                      {capability.code}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    <ListChecks className="size-3.5" aria-hidden="true" />
                    {fields.length} {fields.length === 1 ? "campo" : "campos"}
                  </Badge>
                  <Badge variant="outline">
                    {required} {required === 1 ? "obligatorio" : "obligatorios"}
                  </Badge>
                </div>
                <dl className="divide-y divide-border">
                  {fields.slice(0, 3).map((field) => (
                    <div
                      key={field.key}
                      className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      <dt className="min-w-0 text-sm">
                        <span className="block break-words font-medium">
                          {field.label}
                        </span>
                        <span className="mt-1 block break-all font-mono text-xs text-muted-foreground">
                          {field.key}
                        </span>
                      </dt>
                      <dd className="shrink-0 text-xs text-muted-foreground">
                        {field.format === "service"
                          ? "Servicio del sistema"
                          : field.options?.length
                            ? "Selección"
                            : capabilityFieldTypes.find(
                                (type) => type.value === field.type,
                              )?.label}
                      </dd>
                    </div>
                  ))}
                </dl>
                {fields.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    Y {fields.length - 3}{" "}
                    {fields.length === 4 ? "campo más" : "campos más"} en el
                    esquema.
                  </p>
                )}
              </div>
              <div className="flex justify-end border-t border-border bg-muted/30 px-5 py-3 sm:px-6">
                <Button
                  id={`capability-edit-${capability.code}`}
                  variant="outline"
                  className="min-h-10 w-full sm:w-auto"
                  aria-label={`Editar esquema de ${capability.name}`}
                  render={
                    <Link
                      href={`${listHref}/${encodeURIComponent(capability.code)}/edit`}
                    />
                  }
                >
                  Editar esquema
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
