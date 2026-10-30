import { Button } from "@/components/zuno/button";
import { scopeKey } from "@/features/oauth-scopes/types";
import {
  connectionServices,
  ConnectionPermissions,
} from "./connection-permissions";
import {
  configurationIssues,
  needs,
  schemaFields,
  type ConnectionDraft,
  type ConnectionOptions,
  type LegalOptions,
  type PaymentsOptions,
} from "./connections-model";

export function connectionReviewIssues(
  value: ConnectionDraft,
  options: ConnectionOptions,
  details?: { payments?: PaymentsOptions; legal?: LegalOptions },
) {
  const issues = configurationIssues(value, options.capabilities);
  const n = needs(value.selected);
  if (
    n.payments &&
    value.payments.productCode &&
    details?.payments &&
    !details.payments.products.some(
      (p) => p.code === value.payments.productCode,
    )
  )
    issues.push("Selecciona un producto disponible en Billing.");
  if (
    n.organizations &&
    value.payments.organizationScope === "organizations" &&
    details?.payments &&
    value.payments.organizationIds.some(
      (id) => !details.payments?.organizations.some((o) => o.id === id),
    )
  )
    issues.push(
      "Revisa las organizaciones seleccionadas: alguna ya no está disponible.",
    );
  if (
    n.legal &&
    details?.legal &&
    (value.legal.applicationId || value.legal.documentIds.length) &&
    (!details.legal.applications.some(
      (a) => a.id === value.legal.applicationId,
    ) ||
      value.legal.documentIds.some(
        (id) =>
          !details.legal?.documents.some(
            (d) => d.id === id && d.applicationId === value.legal.applicationId,
          ),
      ))
  )
    issues.push("Selecciona una aplicación y documentos disponibles en Legal.");
  for (const capability of options.capabilities) {
    for (const fn of (capability.functions ?? []).filter((f) =>
      value.selected[capability.code]?.includes(f.code),
    )) {
      if (!fn.scopes.length)
        issues.push(`Define los permisos de ${fn.name} en el catálogo.`);
      for (const ref of fn.scopes) {
        const scope = options.choices.scopes.find(
          (s) => scopeKey(s) === scopeKey(ref),
        );
        if (!scope?.enabled || !scope.resource)
          issues.push(
            `Revisa el permiso ${scope?.name || ref.code} de ${scope?.apiName || ref.audience} en el catálogo.`,
          );
      }
    }
  }
  return [...new Set(issues)];
}

export function ConnectionReview({
  options,
  value,
  systemName,
  newSystem,
  newClient,
  payments,
  legal,
  saved = false,
  onEdit,
}: {
  options: ConnectionOptions;
  value: ConnectionDraft;
  systemName: string;
  newSystem: boolean;
  newClient: boolean;
  payments?: PaymentsOptions;
  legal?: LegalOptions;
  saved?: boolean;
  onEdit: (step: number) => void;
}) {
  const system = options.systems.find((s) => s.id === value.systemId);
  const client =
    !newClient && !newSystem
      ? options.choices.clients.find((c) => c.clientId === value.clientId)
      : undefined;
  const pending = connectionReviewIssues(value, options, { payments, legal });
  const n = needs(value.selected);
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">
          {saved ? "Resumen de la conexión" : "Revisar antes de guardar"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {saved
            ? "Sistema, servicios y permisos de esta conexión."
            : "Confirma los servicios y permisos antes de guardar."}
        </p>
      </div>
      <section
        aria-labelledby="connection-review-system"
        className="space-y-3 rounded-lg bg-muted/40 p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 id="connection-review-system" className="text-sm font-semibold">
            Sistema: {systemName}
          </h3>
          {!saved && (
            <Button type="button" variant="outline" onClick={() => onEdit(0)}>
              Cambiar sistema y funciones
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {newSystem ? "Se creará al guardar" : "Sistema existente"}
        </p>
        <div className="space-y-1 text-sm">
          <p className="font-medium">
            Cliente OAuth:{" "}
            {client?.name ||
              (newClient || newSystem
                ? "Console preparará el acceso al guardar"
                : value.clientId || "Pendiente")}
          </p>
          {client?.description && (
            <details className="text-xs text-muted-foreground">
              <summary className="min-h-10 cursor-pointer py-2 focus-visible:outline-ring">Detalles del cliente OAuth</summary>
              <p>{client.description}</p>
              <code className="mt-2 block">{client.clientId}</code>
            </details>
          )}
        </div>
      </section>

      <section
        aria-labelledby="connection-review-services"
        className="space-y-4"
      >
        <h3 id="connection-review-services" className="text-base font-semibold">
          Servicios y permisos
        </h3>
        {options.capabilities
          .filter((c) => value.selected[c.code]?.length)
          .map((capability) => {
            const functions = (capability.functions ?? []).filter((f) =>
              value.selected[capability.code].includes(f.code),
            );
            const references = [
              ...new Map(
                functions
                  .flatMap((f) => f.scopes)
                  .map((ref) => [scopeKey(ref), ref]),
              ).values(),
            ];
            const services = connectionServices(
              capability,
              options.choices.scopes,
              value.selected[capability.code],
            );
            const settings: { label: string; value: string }[] = [];
            const technicalSettings: typeof settings = [];
            if (capability.code === "payments") {
              settings.push({
                label: "Producto",
                value:
                  payments?.products.find(
                    (p) => p.code === value.payments.productCode,
                  )?.name ||
                  value.payments.productCode ||
                  "Pendiente",
              });
              if (n.organizations)
                settings.push({
                  label: "Organizaciones",
                  value:
                    value.payments.organizationScope ===
                    "all_for_allowed_products"
                      ? "Todas las autorizadas para este producto"
                      : value.payments.organizationIds
                          .map(
                            (id) =>
                              payments?.organizations.find((o) => o.id === id)
                                ?.name || "Organización no disponible",
                          )
                          .join(", ") || "Pendiente",
                });
              if (n.checkout)
                settings.push(
                  {
                    label: "Al completar el pago",
                    value: value.payments.successUrl || "Pendiente",
                  },
                  {
                    label: "Al cancelar el pago",
                    value: value.payments.cancelUrl || "Pendiente",
                  },
                );
              if (n.receiver && value.payments.customServices)
                technicalSettings.push({
                  label: "Receptor de licencias",
                  value:
                    system?.services.find(
                      (s) => s.code === value.payments.receiverService,
                    )?.name || "Pendiente",
                });
            }
            if (capability.code === "legalAcceptances" && n.legal) {
              settings.push({
                label: "Aplicación en Legal",
                value:
                  legal?.applications.find(
                    (a) => a.id === value.legal.applicationId,
                  )?.name || "Pendiente",
              });
              settings.push({
                label: "Documentos",
                value:
                  value.legal.documentIds
                    .map(
                      (id) =>
                        legal?.documents.find((d) => d.id === id)?.name ||
                        "Documento no disponible",
                    )
                    .join(", ") || "Pendiente",
              });
            }
            if (
              !value.payments.customServices &&
              n.payments &&
              (n.checkout || n.receiver) &&
              capability.code === "payments"
            )
              technicalSettings.push({
                label: "Backend de la aplicación",
                value: value.payments.backendBaseUrl || "Pendiente",
              });
            for (const field of schemaFields(
              capability,
              value.selected,
              n.payments && !value.payments.customServices && (n.checkout || n.receiver),
            )) {
              const current = value.configuration[capability.code]?.[field.key];
              if (current !== undefined && current !== "")
                technicalSettings.push({
                  label:
                    field.key === "identityIssuer"
                      ? "Origen de las cuentas"
                      : field.label,
                  value:
                    field.format === "service"
                      ? system?.services.find((s) => s.code === current)
                          ?.name || "Servicio no disponible"
                      : typeof current === "boolean"
                        ? current
                          ? "Sí"
                          : "No"
                        : String(current),
                });
            }
            return (
              <div
                key={capability.code}
                className="space-y-4 rounded-lg border border-border p-4"
              >
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">
                    {services.map((s) => s.name).join(" / ") || capability.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {functions.map((f) => f.name).join(" · ")}
                  </p>
                </div>
                {settings.length > 0 && (
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    {settings.map((setting, i) => (
                      <div key={i}>
                        <dt className="text-xs text-muted-foreground">
                          {setting.label}
                        </dt>
                        <dd className="mt-1 break-words">{setting.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {technicalSettings.length > 0 && (
                  <details className="text-sm">
                    <summary className="min-h-10 cursor-pointer py-2 font-medium focus-visible:outline-ring">Detalles técnicos</summary>
                    <dl className="mt-2 grid gap-3 sm:grid-cols-2">
                      {technicalSettings.map((setting, i) => (
                        <div key={i}>
                          <dt className="text-xs text-muted-foreground">{setting.label}</dt>
                          <dd className="mt-1 break-words">{setting.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                )}
                <div className="space-y-2 border-t border-border pt-3">
                  <p className="text-xs font-medium">
                    Permisos de esta conexión
                  </p>
                  <ul className="space-y-2 text-sm">
                    {references.map((ref) => {
                      const scope = options.choices.scopes.find(
                        (s) => scopeKey(s) === scopeKey(ref),
                      );
                      const granted = Boolean(
                        client &&
                        ((client.audience === ref.audience &&
                          client.scopes.includes(ref.code)) ||
                          client.serviceDestinations?.some(
                            (d) =>
                              d.audience === ref.audience &&
                              d.scopes.includes(ref.code),
                          )),
                      );
                      return (
                        <li
                          key={scopeKey(ref)}
                          className="flex flex-wrap justify-between gap-x-4 gap-y-1"
                        >
                          <span>{scope?.name || ref.code}</span>
                          <span className="text-xs text-muted-foreground">
                            {!scope?.enabled || !scope.resource
                              ? "Revisar en catálogo"
                              : saved
                                ? "Incluido en la conexión"
                                : granted
                                  ? "Ya autorizado"
                                  : "Se autorizará al guardar"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  <ConnectionPermissions
                    references={references}
                    scopes={options.choices.scopes}
                  />
                </div>
              </div>
            );
          })}
        {!saved && (
          <Button type="button" variant="outline" onClick={() => onEdit(1)}>
            Cambiar configuración
          </Button>
        )}
      </section>

      {!saved && (
        <section
          aria-labelledby="connection-review-pending"
          className="space-y-3 rounded-lg border border-border p-4"
        >
          <h3 id="connection-review-pending" className="text-sm font-semibold">
            Pendientes antes de guardar
          </h3>
          {pending.length ? (
            <>
              <p className="text-sm text-muted-foreground">
                Completa estos puntos para guardar.
              </p>
              <ul className="list-inside list-disc space-y-2 text-sm">
                {pending.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-primary">
              Sin datos pendientes. Lista para guardar.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Al guardar se aplican los permisos y recibes el .env para tu backend.
          </p>
        </section>
      )}
    </div>
  );
}
