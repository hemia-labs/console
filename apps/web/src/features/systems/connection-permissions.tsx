import type { ApiScope, ScopeReference } from "@/features/oauth-scopes/types";
import type { Capability } from "./types";

export function connectionServices(
  capability: Capability,
  scopes: ApiScope[],
  functions?: string[],
) {
  const primaryAudience =
    capability.code === "legalAcceptances"
      ? "legal-api"
      : capability.code === "payments"
        ? "billing-api"
        : undefined;
  const audiences = [
    ...new Set(
      (capability.functions ?? [])
        .filter((f) => !functions || functions.includes(f.code))
        .flatMap((f) => f.scopes.map((s) => s.audience)),
    ),
  ];
  return audiences
    .filter((audience) => !primaryAudience || audience === primaryAudience)
    .map((audience) => {
      const scope = scopes.find((s) => s.audience === audience);
      return {
        audience,
        name: scope?.apiName || audience,
        description: scope?.apiDescription,
      };
    });
}

export function ConnectionServicesInfo({
  services,
}: {
  services: ReturnType<typeof connectionServices>;
}) {
  return (
    <div className="space-y-3 py-2">
      {services.map((service) => (
        <div key={service.audience} className="space-y-1">
          <p className="text-sm font-medium">{service.name}</p>
          {service.description && (
            <details className="text-xs text-muted-foreground">
              <summary className="min-h-10 cursor-pointer py-2 focus-visible:outline-ring">
                Acerca del servicio
              </summary>
              <p>{service.description}</p>
            </details>
          )}
        </div>
      ))}
    </div>
  );
}

export function ConnectionPermissions({
  references,
  scopes,
}: {
  references: ScopeReference[];
  scopes: ApiScope[];
}) {
  const unique = references.filter(
    (ref, i) =>
      references.findIndex(
        (s) => s.audience === ref.audience && s.code === ref.code,
      ) === i,
  );
  if (!unique.length)
    return (
      <p className="text-xs text-muted-foreground">
        Esta función aún no tiene permisos definidos en el catálogo.
      </p>
    );
  return (
    <details className="text-xs">
      <summary className="min-h-10 cursor-pointer py-2 text-muted-foreground focus-visible:outline-ring">
        Ver permisos incluidos ({unique.length})
      </summary>
      <ul
        className="space-y-3 border-l border-border pl-4"
        aria-label="Permisos incluidos"
      >
        {unique.map((ref) => {
          const scope = scopes.find(
            (s) => s.audience === ref.audience && s.code === ref.code,
          );
          return (
            <li
              key={JSON.stringify([ref.audience, ref.code])}
              className="space-y-1"
            >
              <p className="font-medium">{scope?.name || ref.code}</p>
              <p className="text-muted-foreground">
                {scope?.description ||
                  "Permiso sin descripción en el catálogo."}
              </p>
              <p className="text-muted-foreground">
                {scope?.apiName || ref.audience}
              </p>
              {(!scope || !scope.enabled) && (
                <p className="text-destructive">
                  {scope
                    ? "Permiso no disponible para nuevas asignaciones."
                    : "Permiso no registrado en el catálogo."}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </details>
  );
}
