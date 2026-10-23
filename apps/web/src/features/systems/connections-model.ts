import type {
  Capability,
  CapabilityField,
  CatalogChoices,
  System,
} from "./types";
export type Selection = Record<string, string[]>;
export type ConnectionOptions = {
  systems: System[];
  capabilities: Capability[];
  choices: CatalogChoices;
};
export type PaymentsOptions = {
  products: { code: string; name: string }[];
  organizations: { id: string; name: string }[];
  policies: {
    clientId: string;
    organizationScope: "organizations" | "all_for_allowed_products";
    organizationIds?: string[];
  }[];
};
export type LegalOptions = {
  applications: { id: string; name: string }[];
  documents: { id: string; name: string; applicationId: string }[];
  integrations: {
    systemId: string;
    applicationId: string;
    documentIds: string[];
  }[];
};
export type ConnectionDraft = {
  systemId: string;
  clientId: string;
  selected: Selection;
  configuration: System["configuration"];
  payments: {
    backendBaseUrl: string;
    customServices: boolean;
    productCode: string;
    organizationScope: "organizations" | "all_for_allowed_products";
    organizationIds: string[];
    successUrl: string;
    cancelUrl: string;
    receiverService: string;
    checkService: string;
  };
  legal: { applicationId: string; documentIds: string[] };
};
export function needs(selected: Selection) {
  const functions = selected.payments ?? [];
  const checkout =
    functions.includes("checkout") || functions.includes("subscriptions");
  return {
    payments: functions.length > 0,
    checkout,
    organizations:
      checkout ||
      functions.includes("licenses") ||
      functions.includes("subscriptions"),
    receiver: functions.includes("receiver"),
    legal: (selected.legalAcceptances ?? []).includes("collector"),
  };
}
export function applies(field: CapabilityField, functions: string[]) {
  return (
    !field.functions || field.functions.some((code) => functions.includes(code))
  );
}
export function presetSelection(
  preset: string | undefined,
  capabilities: Capability[],
): Selection {
  if (preset !== "payments") return {};
  return Object.fromEntries(
    capabilities
      .filter((c) => c.code === "payments")
      .map((c) => [
        c.code,
        (c.functions ?? [])
          .filter((f) =>
            [
              "catalog",
              "checkout",
              "licenses",
              "receiver",
              "subscriptions",
            ].includes(f.code),
          )
          .map((f) => f.code),
      ]),
  );
}
export function selectFunction(
  selected: Selection,
  capability: string,
  fn: string,
  checked: boolean,
): Selection {
  const next = {
    ...selected,
    [capability]: checked
      ? [...new Set([...(selected[capability] ?? []), fn])]
      : (selected[capability] ?? []).filter((code) => code !== fn),
  };
  return next;
}
export function reusableClients(
  system: System | undefined,
  choices: CatalogChoices,
) {
  return [
    ...new Set(
      system?.clients
        .filter(
          (c) =>
            c.enabled &&
            !(
              c.capabilityCode === "legalAcceptances" &&
              c.roles.every((r) => r === "validator")
            ),
        )
        .map((c) => c.clientId) ?? [],
    ),
  ].filter((id) => choices.clients.some((c) => c.clientId === id));
}
export function initialDraft(
  selected: Selection,
  system?: System,
  choices?: CatalogChoices,
): ConnectionDraft {
  const p = system?.configuration.payments ?? {};
  const clients = choices ? reusableClients(system, choices) : [];
  const standardService = system?.services.find(
    (service) =>
      service.enabled &&
      ["payments-license", "payments-check"].includes(service.code),
  );
  const backendBaseUrl =
    standardService?.url.replace(
      /\/payments\/(?:webhooks\/license|integration-status)$/,
      "",
    ) ?? "";
  return {
    systemId: system?.id ?? "",
    clientId: clients.length === 1 ? clients[0] : "",
    selected,
    configuration: { ...system?.configuration },
    payments: {
      backendBaseUrl,
      customServices:
        !backendBaseUrl && Boolean(p.receiverService || p.checkService),
      productCode: String(p.productCode ?? ""),
      organizationScope: "organizations",
      organizationIds: [],
      successUrl: String(p.successUrl ?? ""),
      cancelUrl: String(p.cancelUrl ?? ""),
      receiverService: String(p.receiverService ?? ""),
      checkService: String(p.checkService ?? ""),
    },
    legal: { applicationId: "", documentIds: [] },
  };
}
export function schemaFields(
  capability: Capability,
  selected: Selection,
  standardBackend = false,
) {
  const relevant = needs(selected);
  return capability.schema.fields.filter(
    (f) =>
      !(
        standardBackend &&
        capability.code === "legalAcceptances" &&
        f.key === "contextService"
      ) &&
      applies(f, selected[capability.code] ?? []) &&
      !(
        capability.code === "payments" &&
        [
          "backendBaseUrl",
          "productCode",
          "successUrl",
          "cancelUrl",
          "receiverService",
          "checkService",
          "enabled",
        ].includes(f.key)
      ) &&
      !(
        capability.code === "legalAcceptances" &&
        (f.key === "enabled" || (relevant.checkout && f.key === "productCode"))
      ),
  );
}
export function connectionPayload(
  value: ConnectionDraft,
  capabilities: Capability[],
) {
  const relevant = needs(value.selected);
  const p = value.payments;
  return {
    systemId: value.systemId,
    ...(value.clientId ? { clientId: value.clientId } : {}),
    capabilities: capabilities
      .filter((c) => value.selected[c.code]?.length)
      .map((c) => ({
        code: c.code,
        functions: value.selected[c.code],
        configuration: Object.fromEntries(
          schemaFields(
            c,
            value.selected,
            relevant.payments && !p.customServices,
          )
            .filter((f) => value.configuration[c.code]?.[f.key] !== undefined)
            .map((f) => [f.key, value.configuration[c.code][f.key]]),
        ),
      })),
    ...(relevant.payments
      ? {
          payments: {
            productCode: p.productCode,
            ...(!p.customServices &&
            (relevant.checkout || relevant.receiver || relevant.legal)
              ? { backendBaseUrl: p.backendBaseUrl }
              : {}),
            ...(relevant.organizations
              ? {
                  organizationScope: p.organizationScope,
                  ...(p.organizationScope === "organizations"
                    ? { organizationIds: p.organizationIds }
                    : {}),
                }
              : {}),
            ...(relevant.checkout
              ? {
                  successUrl: p.successUrl,
                  cancelUrl: p.cancelUrl,
                  ...(p.customServices && p.checkService
                    ? { checkService: p.checkService }
                    : {}),
                }
              : {}),
            ...(relevant.receiver && p.customServices
              ? { receiverService: p.receiverService }
              : {}),
          },
        }
      : {}),
    ...(relevant.legal ? { legal: value.legal } : {}),
  };
}
export function configurationError(
  value: ConnectionDraft,
  capabilities: Capability[],
) {
  const n = needs(value.selected),
    p = value.payments;
  if (n.payments && !p.productCode) return "Selecciona un producto.";
  if (
    n.organizations &&
    p.organizationScope === "organizations" &&
    !p.organizationIds.length
  )
    return "Selecciona las organizaciones autorizadas.";
  if (n.checkout && (!p.successUrl || !p.cancelUrl))
    return "Completa los regresos del pago.";
  if (
    n.payments &&
    !p.customServices &&
    (n.checkout || n.receiver || n.legal)
  ) {
    try {
      const base = new URL(p.backendBaseUrl);
      if (
        p.backendBaseUrl.includes("?") ||
        p.backendBaseUrl.includes("#") ||
        base.username ||
        base.password ||
        base.search ||
        base.hash ||
        (base.protocol !== "https:" &&
          !(
            base.protocol === "http:" &&
            ["localhost", "127.0.0.1", "[::1]"].includes(base.hostname)
          ))
      )
        throw new Error();
    } catch {
      return "Completa una URL base segura del backend, incluido su prefijo API.";
    }
  }
  if (n.receiver && p.customServices && !p.receiverService)
    return "Selecciona el receptor de licencias.";
  if (
    n.legal &&
    (!value.legal.applicationId || !value.legal.documentIds.length)
  )
    return "Selecciona la aplicación legal y sus documentos.";
  for (const c of capabilities.filter((c) => value.selected[c.code]?.length))
    for (const f of schemaFields(
      c,
      value.selected,
      n.payments && !p.customServices,
    ))
      if (
        f.required &&
        (value.configuration[c.code]?.[f.key] === undefined ||
          value.configuration[c.code]?.[f.key] === "")
      )
        return `Completa ${f.label}.`;
  return "";
}
