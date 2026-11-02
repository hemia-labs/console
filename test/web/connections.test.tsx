import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  ConnectionConfiguration,
  ConnectionConfigurationOutput,
  ConnectionForm,
  connectionStatus,
} from "../../apps/web/src/features/systems/connections";
import {
  connectionPayload,
  clientCreationSelection,
  configurationError,
  initialDraft,
  needs,
  presetSelection,
  schemaFields,
  selectFunction,
  reusableClients,
  suggestedSystemCode,
  type ConnectionOptions,
} from "../../apps/web/src/features/systems/connections-model";
import { CapabilityForm } from "../../apps/web/src/features/systems/capability-form";
import { readSchema } from "../../apps/web/src/features/systems/types";
import { ConnectionReview, connectionReviewIssues } from "../../apps/web/src/features/systems/connection-review";
import { ConnectionDeliveryResult } from "../../apps/web/src/features/systems/connection-delivery";
import { connectionEnv } from "../../apps/web/src/features/systems/connection-delivery-model";
import { parseEnv } from "node:util";
import { ConfigurationFileView } from "../../apps/web/src/features/systems/connection-configuration-view";
const options: ConnectionOptions = {
  systems: [
    {
      id: "system",
      code: "product",
      name: "Producto",
      enabled: true,
      services: [
        {
          code: "context",
          name: "Contexto",
          url: "https://product.test/context",
          audience: "product-api",
          resource: "https://product.test",
          enabled: true,
        },
      ],
      configuration: {
        payments: { productCode: "product", checkService: "configured-check" },
        legalAcceptances: {
          contextService: "context",
          identityIssuer: "urn:hemia:product",
        },
        notifications: { channel: "email" },
      },
      clients: [
        {
          oauthIssuer: "https://identity.test",
          clientId: "backend",
          capabilityCode: "notifications",
          roles: ["send"],
          enabled: true,
        },
        {
          oauthIssuer: "https://identity.test",
          clientId: "validator",
          capabilityCode: "legalAcceptances",
          roles: ["validator"],
          enabled: true,
        },
      ],
    },
  ],
  choices: {
    oauthIssuer: "https://identity.test",
    verificationClientId: "legal",
    scopes: [],
    audiences: [],
    clients: ["backend", "validator"].map((clientId) => ({
      clientId,
      oauthIssuer: "https://identity.test",
      name: clientId,
      scopes: [],
    })),
  },
  capabilities: [
    {
      code: "payments",
      name: "Pagos",
      functions: [
        "catalog",
        "checkout",
        "licenses",
        "receiver",
        "subscriptions",
      ].map((code) => ({ code, name: code, scopes: [] })),
      schema: { fields: [] },
    },
    {
      code: "legalAcceptances",
      name: "Aceptaciones legales",
      functions: [
        { code: "collector", name: "Registrar aceptaciones", scopes: [] },
        { code: "validator", name: "Validar aceptaciones", scopes: [] },
      ],
      schema: {
        fields: [
          {
            key: "contextService",
            label: "Servicio de contexto",
            type: "string",
            format: "service",
            required: true,
            functions: ["collector"],
          },
        ],
      },
    },
    {
      code: "notifications",
      name: "Avisos",
      functions: [
        { code: "send", name: "Enviar avisos", scopes: [] },
        { code: "read", name: "Consultar avisos", scopes: [] },
      ],
      schema: {
        fields: [
          {
            key: "channel",
            label: "Canal",
            type: "string",
            options: ["email", "sms"],
            required: true,
            functions: ["send"],
          },
          { key: "region", label: "Región", type: "string" },
        ],
      },
    },
  ],
};
const payments = {
  products: [{ code: "product", name: "Producto" }],
  organizations: [],
  policies: [],
};
const legal = { applications: [], documents: [], integrations: [] };
test("wizard explains APIs and permissions from the catalog without changing selections", () => {
  const ref = { audience: "billing-api", code: "billing.integration.catalog.read" };
  const catalogOptions: ConnectionOptions = {
    ...options,
    capabilities: [{ ...options.capabilities[0], functions: [{ code: "catalog", name: "Consultar planes", scopes: [ref] }] }],
    choices: { ...options.choices, scopes: [{
      ...ref, id: "catalog", kind: "api", enabled: true, resource: "https://billing.test",
      name: "Consultar el catálogo de planes", description: "Consulta planes disponibles para el producto.",
      apiName: "Hemia Billing · Planes y pagos", apiDescription: "Ofrece planes y licencias para tu producto.",
    }] },
  };
  const page = renderToStaticMarkup(<ConnectionForm options={catalogOptions} systemsHref="/es/catalogs/systems" />);
  expect(page).toContain("Hemia Billing · Planes y pagos");
  expect(page).toContain("Ofrece planes y licencias para tu producto.");
  expect(page).toMatch(/<details[^>]*><summary[^>]*>Acerca del servicio<\/summary><p>Ofrece planes y licencias para tu producto\.<\/p><\/details>/);
  expect(page).toContain("Consultar el catálogo de planes");
  expect(page).toContain("Consulta planes disponibles para el producto.");
  expect(clientCreationSelection({ payments: ["catalog"] }, catalogOptions.capabilities)).toEqual({ capabilityCode: "payments", roles: ["catalog"] });
});
test("Legal keeps Identity as a permission dependency instead of a second selected service", () => {
  const refs = [{ audience: "legal-api", code: "legal.integration.acceptances.create" }, { audience: "identity-api", code: "identity.tokens.introspect" }];
  const catalogOptions: ConnectionOptions = {
    ...options,
    capabilities: [{ ...options.capabilities[1], functions: [{ code: "collector", name: "Registrar aceptaciones", scopes: refs }] }],
    choices: { ...options.choices, scopes: refs.map((ref, i) => ({
      ...ref, id: String(i), kind: "api", enabled: true, resource: "https://api.test",
      name: i ? "Verificar tokens de acceso" : "Registrar evidencia",
      description: i ? "Comprueba si el token está activo." : "Guarda la aceptación del documento.",
      apiName: i ? "Hemia ID" : "Hemia Legal", apiDescription: i ? "Administra usuarios y clientes OAuth." : "Documentos y aceptaciones.",
    })) },
  };
  const page = renderToStaticMarkup(<ConnectionForm options={catalogOptions} systemsHref="/es/catalogs/systems" />);
  expect(page).toContain("Documentos y aceptaciones.");
  expect(page).not.toContain("Administra usuarios y clientes OAuth.");
  expect(page).toContain("Verificar tokens de acceso");
  expect(page.indexOf("Hemia ID")).toBeGreaterThan(page.indexOf("Ver permisos incluidos"));
  expect(clientCreationSelection({ legalAcceptances: ["collector"] }, catalogOptions.capabilities)).toEqual({ capabilityCode: "legalAcceptances", roles: ["collector"] });
});
test("new system starts inside the connection wizard when the directory is empty", () => {
  const page = renderToStaticMarkup(<ConnectionForm options={{ ...options, systems: [] }} systemsHref="/es/catalogs/systems" />);
  expect(page).toContain("Nombre del sistema");
  expect(page).toContain("El acceso se creará al guardar.");
  expect(page).toMatch(/<details><summary[^>]*>Identificador del sistema<\/summary>/);
  expect(page).not.toContain("Guarda su secreto");
  expect(page).not.toContain("codigo-backend");
  expect(page).not.toContain("Crear sistema y cliente");
  expect(page).toContain("Continuar");
  expect(page).toContain("Configurar servicios");
  expect(page).not.toContain('href="/es/catalogs/systems/new"');
  expect(suggestedSystemCode("Clínica del Sol")).toBe("clinica-del-sol");
});
test("client creation uses only selected functions with catalogued permissions", () => {
  const capabilities = [{ ...options.capabilities[2], functions: [
    { code: "send", name: "Enviar", scopes: [{ code: "notifications.send", audience: "notifications-api" }] },
    { code: "read", name: "Consultar", scopes: [] },
  ] }];
  expect(clientCreationSelection({ notifications: ["read", "unknown"] }, capabilities)).toBeUndefined();
  expect(clientCreationSelection({ notifications: ["send", "read"] }, capabilities)).toEqual({ capabilityCode: "notifications", roles: ["send"] });
});
function draft(selected: Record<string, string[]>) {
  return initialDraft(selected, options.systems[0], options.choices);
}
function html(selected: Record<string, string[]>) {
  return renderToStaticMarkup(
    <ConnectionConfiguration
      options={options}
      value={draft(selected)}
      onChange={() => {}}
      payments={payments}
      legal={legal}
    />,
  );
}
test("Legal summarizes recovered required data and keeps optional verification under advanced settings", () => {
  const value = draft({ legalAcceptances: ["collector"] });
  value.legal = { applicationId: "app", documentIds: ["terms"] };
  const page = renderToStaticMarkup(<ConnectionConfiguration
    options={{ ...options, capabilities: [{ ...options.capabilities[1], schema: { fields: [
      { key: "identityIssuer", label: "Identidad de origen", type: "string", required: true, format: "identity-issuer" },
      { key: "contextService", label: "Servicio de verificación", type: "string", format: "service" },
    ] } }] }} value={value} onChange={() => {}} legal={{
      applications: [{ id: "app", name: "Registro" }],
      documents: [{ id: "terms", name: "Términos", applicationId: "app" }], integrations: [],
    }} />);
  expect(page).toContain("Documentos legales");
  expect(page).toContain("Completa lo que falta o cambia los datos recuperados.");
  expect(page).toContain("1 de 1 seleccionados");
  expect(page).toContain("Origen de las cuentas");
  expect(page).not.toContain('id="connection-legalAcceptances-identityIssuer"');
  expect(page).toContain('Cambiar Origen de las cuentas');
  expect(page.indexOf('id="connection-legalAcceptances-contextService"')).toBeGreaterThan(page.indexOf("<details"));
  expect(page).not.toMatch(/<details[^>]*\sopen(?:=|\s|>)/);
  expect(page).not.toContain("namespace");
  expect(page).toContain('urn:hemia:product');
});
test("each selected service keeps its configuration in an independent block", () => {
  const value = draft({ legalAcceptances: ["collector"], payments: ["catalog"], notifications: ["send"] });
  value.payments.customServices = false;
  const page = renderToStaticMarkup(<ConnectionConfiguration options={options} value={value} onChange={() => {}} payments={payments} legal={legal} />);
  const legalBlock = page.match(/<section aria-labelledby="connection-service-legalAcceptances">([\s\S]*?)<\/section>/)?.[1] ?? "";
  const paymentsBlock = page.match(/<section aria-labelledby="connection-service-payments">([\s\S]*?)<\/section>/)?.[1] ?? "";
  const notificationsBlock = page.match(/<section aria-labelledby="connection-service-notifications">([\s\S]*?)<\/section>/)?.[1] ?? "";
  expect(legalBlock).toContain('id="connection-application"');
  expect(legalBlock).toContain("Aceptación de documentos");
  expect(legalBlock).not.toContain('id="connection-product"');
  expect(legalBlock).not.toContain('id="connection-backend"');
  expect(paymentsBlock).toContain('Cambiar Producto en Billing');
  expect(paymentsBlock).not.toContain('id="connection-application"');
  expect(paymentsBlock).not.toContain('id="connection-backend"');
  expect(notificationsBlock).toContain('Cambiar Canal');
  expect(notificationsBlock).not.toContain('id="connection-application"');
  expect(html({ payments: ["catalog"] })).not.toContain('aria-labelledby="connection-service-legalAcceptances"');
});
test("step two summarizes recovered settings, keeps their payload and asks only for missing values", () => {
  const system = { ...options.systems[0], services: [{ ...options.systems[0].services[0], code: "payments-legal-context", url: "https://product.test/api/payments/legal/context" }], configuration: { ...options.systems[0].configuration, payments: { productCode: "product", successUrl: "https://product.test/done", cancelUrl: "https://product.test/cancel" } } };
  const value = initialDraft({ payments: ["catalog", "checkout"], legalAcceptances: ["collector"] }, system, options.choices);
  expect(value.payments.backendBaseUrl).toBe("https://product.test/api");
  value.legal = { applicationId: "app", documentIds: ["terms"] };
  value.payments.organizationIds = ["org"];
  const paymentOptions = { ...payments, organizations: [{ id: "org", name: "Organización existente" }], policies: [{ clientId: "backend", products: ["product"], organizationScope: "organizations" as const, organizationIds: ["org"] }] };
  const legalOptions = { applications: [{ id: "app", name: "Registro existente" }], documents: [{ id: "terms", name: "Términos vigentes", applicationId: "app" }], integrations: [{ systemId: "system", applicationId: "app", documentIds: ["terms"] }] };
  const before = connectionPayload(value, options.capabilities);
  const render = () => renderToStaticMarkup(<ConnectionConfiguration options={{ ...options, systems: [system] }} value={value} onChange={() => {}} payments={paymentOptions} legal={legalOptions} />);
  const page = render();
  for (const field of ["product", "application", "backend", "scope", "successUrl", "cancelUrl", "legalAcceptances-contextService"]) expect(page).not.toContain(`id="connection-${field}"`);
  for (const text of ["Configurado", "Registro existente", "Términos vigentes", "Organización existente", "https://product.test/api"]) expect(page).toContain(text);
  expect(connectionPayload(value, options.capabilities)).toEqual(before);
  value.payments.cancelUrl = "";
  expect(render()).toContain('id="connection-cancelUrl"');
  expect(configurationError(value, options.capabilities)).toContain("regresos");
  legalOptions.documents = [];
  expect(render()).toContain('id="connection-application"');
});
test("review shows existing and new permissions without changing the payload", () => {
  const refs = [{ audience: "billing-api", code: "billing.integration.catalog.read" }, { audience: "billing-api", code: "billing.integration.licenses.read" }];
  const catalogOptions: ConnectionOptions = { ...options,
    capabilities: [{ ...options.capabilities[0], functions: [{ code: "catalog", name: "Consultar planes", scopes: [refs[0]] }, { code: "licenses", name: "Consultar licencias", scopes: [refs[1]] }] }],
    choices: { ...options.choices, clients: [{ ...options.choices.clients[0], name: "Integraciones del producto", audience: "billing-api", scopes: [refs[0].code] }], scopes: refs.map((ref, i) => ({ ...ref, id: String(i), kind: "api", enabled: true, resource: "https://billing.test", name: i ? "Consultar licencias del producto" : "Consultar el catálogo", description: "Consulta autorizada.", apiName: "Hemia Billing · Planes y pagos" })) },
  };
  const value = draft({ payments: ["catalog", "licenses"] });
  value.payments.organizationScope = "all_for_allowed_products";
  const before = connectionPayload(value, catalogOptions.capabilities);
  expect(connectionReviewIssues(value, catalogOptions, { payments })).toEqual([]);
  const page = renderToStaticMarkup(<ConnectionReview options={catalogOptions} value={value} systemName="Producto" newSystem={false} newClient={false} payments={payments} onEdit={() => {}} />);
  for (const text of ["Sistema: Producto", "Integraciones del producto", "Hemia Billing · Planes y pagos", "Consultar el catálogo", "Consultar licencias del producto", "Ya autorizado", "Se autorizará al guardar", "Sin datos pendientes"]) expect(page).toContain(text);
  expect(page).not.toContain("Configuración generada");
  expect(connectionPayload(value, catalogOptions.capabilities)).toEqual(before);
});
test("review collects missing configuration before saving and exposes edits", () => {
  const value = draft({ payments: ["checkout"], legalAcceptances: ["collector"] });
  const issues = connectionReviewIssues(value, options, { payments, legal });
  expect(issues).toContain("Selecciona las organizaciones autorizadas.");
  expect(issues).toContain("Completa los regresos del pago.");
  expect(issues).toContain("Selecciona la aplicación legal y sus documentos.");
  expect(issues[0]).toBe(configurationError(value, options.capabilities));
  const page = renderToStaticMarkup(<ConnectionReview options={options} value={value} systemName="Producto" newSystem={false} newClient={false} payments={payments} legal={legal} onEdit={() => {}} />);
  expect(page).toContain("Pendientes antes de guardar");
  expect(page).toContain("Cambiar sistema y funciones");
  expect(page).toContain("Cambiar configuración");
  expect(page).not.toContain("Sin datos pendientes");
});
test("catalog-only requests no Legal, orgs, callbacks, receiver or readiness config", () => {
  const value = draft({ payments: ["catalog"] });
  expect(needs(value.selected)).toEqual({
    payments: true,
    checkout: false,
    organizations: false,
    receiver: false,
    legal: false,
  });
  expect(connectionPayload(value, options.capabilities)).toEqual({
    systemId: "system",
    clientId: "backend",
    capabilities: [
      { code: "payments", functions: ["catalog"], configuration: {} },
    ],
    payments: { productCode: "product" },
  });
  const page = html(value.selected);
  expect(page).toContain("Cambiar Producto en Billing");
  expect(page).not.toContain('id="connection-product"');
  for (const field of [
    "connection-scope",
    "connection-application",
    "connection-successUrl",
    "connection-receiver",
    "connection-check",
  ])
    expect(page).not.toContain(`id="${field}"`);
  expect(configurationError(value, options.capabilities)).toBe("");
});
test("licenses ask organization scope; receiver only needs product and its explicit service", () => {
  const licenses = draft({ payments: ["licenses"] });
  expect(configurationError(licenses, options.capabilities)).toContain(
    "organizaciones",
  );
  licenses.payments.organizationScope = "all_for_allowed_products";
  expect(connectionPayload(licenses, options.capabilities).payments).toEqual({
    productCode: "product",
    organizationScope: "all_for_allowed_products",
  });
  expect(html(licenses.selected)).toContain("connection-scope");
  const receiver = draft({ payments: ["receiver"] });
  expect(receiver.payments.receiverService).toBe(""); // Never guess the only registered endpoint.
  receiver.payments.receiverService = "licenses";
  expect(connectionPayload(receiver, options.capabilities).payments).toEqual({
    productCode: "product",
    receiverService: "licenses",
  });
  expect(html(receiver.selected)).not.toContain("connection-scope");
});
test("checkout works without Legal and collector remains explicitly optional", () => {
  const selected = selectFunction({}, "payments", "checkout", true);
  expect(selected).toEqual({
    payments: ["checkout"],
  });
  const value = draft(selected);
  value.payments = {
    ...value.payments,
    organizationScope: "all_for_allowed_products",
    successUrl: "https://product.test/done",
    cancelUrl: "https://product.test/cancel",
    checkService: "",
  };
  expect(configurationError(value, options.capabilities)).toBe("");
  const payload = connectionPayload(value, options.capabilities);
  expect(payload.payments).not.toHaveProperty("checkService");
  expect(payload.payments).not.toHaveProperty("receiverService");
  expect(payload).not.toHaveProperty("legal");
  expect(html(selected)).not.toContain('id="connection-application"');
  value.selected = selectFunction(
    selected,
    "legalAcceptances",
    "collector",
    true,
  );
  expect(configurationError(value, options.capabilities)).toContain(
    "aplicación legal",
  );
  value.legal = { applicationId: "app", documentIds: ["terms"] };
  expect(configurationError(value, options.capabilities)).toBe("");
  expect(connectionPayload(value, options.capabilities).legal).toEqual(
    value.legal,
  );
  expect(
    selectFunction(value.selected, "legalAcceptances", "collector", false)
      .legalAcceptances,
  ).toEqual([]);
  const initial = renderToStaticMarkup(
    <ConnectionForm
      options={options}
      preset="payments"
      systemsHref="/es/catalogs/systems"
    />,
  );
  expect(initial).toContain("Hemia Legal (opcional)");
  expect(initial).toContain("Legal es opcional.");
  expect(initial).toMatch(/<details[^>]*><summary[^>]*>Documentos en los pagos<\/summary>/);
  expect(initial).not.toContain("Requerida para crear cobros");
  expect(initial).not.toContain("scope=");
});
test("generic capabilities render applicable schema controls and do not ask payments/legal data", () => {
  const value = draft({ notifications: ["send"] });
  expect(needs(value.selected).payments).toBe(false);
  expect(needs(value.selected).legal).toBe(false);
  expect(connectionPayload(value, options.capabilities)).toEqual({
    systemId: "system",
    clientId: "backend",
    capabilities: [
      {
        code: "notifications",
        functions: ["send"],
        configuration: { channel: "email" },
      },
    ],
  });
  const page = html(value.selected);
  expect(page).toContain("Cambiar Canal");
  expect(page).not.toContain('id="connection-notifications-channel"');
  expect(page).not.toContain("connection-product");
  expect(page).not.toContain("textarea");
  expect(
    schemaFields(options.capabilities[2], { notifications: ["read"] }).map(
      (f) => f.key,
    ),
  ).toEqual(["region"]);
  expect(options.systems[0].configuration.notifications.channel).toBe("email");
});
test("one existing backend reused; validator-only identity excluded, ambiguity preserved", () => {
  expect(reusableClients(options.systems[0], options.choices)).toEqual([
    "backend",
  ]);
  expect(draft({}).clientId).toBe("backend");
  const both = {
    ...options.systems[0],
    clients: [
      ...options.systems[0].clients,
      { ...options.systems[0].clients[0], clientId: "validator" },
    ],
  };
  expect(initialDraft({}, both, options.choices).clientId).toBe("");
  expect(presetSelection("payments", options.capabilities)).toEqual({
    payments: ["catalog", "checkout", "licenses", "receiver", "subscriptions"],
  });
  expect(presetSelection(undefined, options.capabilities)).toEqual({});
});
test("field applicability metadata survives schema editor and validation; status labels are distinct", () => {
  expect(
    readSchema(JSON.stringify(options.capabilities[2].schema)).fields[0]
      .functions,
  ).toEqual(["send"]);
  expect(() =>
    readSchema(
      '{"fields":[{"key":"channel","label":"Canal","type":"string","functions":[]}]}',
    ),
  ).toThrow();
  const page = renderToStaticMarkup(
    <CapabilityForm
      capability={options.capabilities[2]}
      onSave={async () => {}}
      cancelHref="/es/catalogs/system-capabilities"
    />,
  );
  expect(page).toContain("Mostrar para funciones");
  expect(page).toContain("Enviar avisos");
  expect(connectionStatus).toEqual({
    configured: "Configuración guardada",
    verified: "Conexión comprobada",
    pending: "Conexión pendiente",
  });
});

test("Legal source namespace is reused independently of the OAuth issuer and never inferred", () => {
  const value = draft({ legalAcceptances: ["collector"] });
  expect(value.configuration.legalAcceptances.identityIssuer).toBe(
    "urn:hemia:product",
  );
  const unconfigured = { ...options.systems[0], configuration: {} };
  expect(
    initialDraft(value.selected, unconfigured, options.choices).configuration,
  ).toEqual({});
  const capability = {
    ...options.capabilities[1],
    schema: {
      fields: [
        {
          key: "identityIssuer",
          label: "Identidad de origen",
          type: "string" as const,
          format: "identity-issuer" as const,
          functions: ["collector"],
        },
      ],
    },
  };
  const page = renderToStaticMarkup(
    <ConnectionConfiguration
      options={{ ...options, capabilities: [capability] }}
      value={value}
      onChange={() => {}}
      legal={legal}
    />,
  );
  expect(page).toContain('urn:hemia:product');
  expect(page).toContain('type="text"');
  expect(page).not.toContain("https://identity.test");
});

test("new payments host uses one backend URL and omits individual service selectors", () => {
  const system = { ...options.systems[0], services: [], configuration: {} };
  const value = initialDraft(
    {
      payments: [
        "catalog",
        "checkout",
        "licenses",
        "receiver",
        "subscriptions",
      ],
      legalAcceptances: ["collector"],
    },
    system,
    options.choices,
  );
  value.payments = {
    ...value.payments,
    productCode: "product",
    organizationScope: "all_for_allowed_products",
    successUrl: "https://portal.test/success",
    cancelUrl: "https://portal.test/cancel",
    backendBaseUrl: "https://api.portal.test/api",
  };
  value.legal = { applicationId: "app", documentIds: ["terms"] };
  expect(configurationError(value, options.capabilities)).toBe("");
  const payload = connectionPayload(value, options.capabilities);
  expect(payload.payments).toHaveProperty(
    "backendBaseUrl",
    "https://api.portal.test/api",
  );
  expect(payload.payments).not.toHaveProperty("receiverService");
  expect(payload.payments).not.toHaveProperty("checkService");
  expect(
    payload.capabilities.find((c) => c.code === "legalAcceptances")
      ?.configuration,
  ).toEqual({});
  const page = renderToStaticMarkup(
    <ConnectionConfiguration
      options={options}
      value={value}
      onChange={() => {}}
      payments={payments}
      legal={legal}
    />,
  );
  expect(page).toContain('id="connection-backend"');
  expect(page).not.toContain('id="connection-receiver"');
  expect(page).not.toContain('id="connection-check"');
  expect(page).not.toContain('id="connection-legalAcceptances-contextService"');
  value.payments.backendBaseUrl = "https://api.portal.test/api?x=y";
  expect(configurationError(value, options.capabilities)).toContain("URL base");
});

test("subscription management uses organization policy selectors and is offered by the payments preset", () => {
  const value = draft({ payments: ["subscriptions"] });
  expect(needs(value.selected).organizations).toBe(true);
  expect(configurationError(value, options.capabilities)).toContain(
    "organizaciones",
  );
  value.payments.organizationScope = "all_for_allowed_products";
  expect(configurationError(value, options.capabilities)).toContain("regresos");
  value.payments.successUrl = "https://product.test/changed";
  value.payments.cancelUrl = "https://product.test/unchanged";
  expect(configurationError(value, options.capabilities)).toBe("");
  expect(connectionPayload(value, options.capabilities).payments).toEqual({
    productCode: "product",
    organizationScope: "all_for_allowed_products",
    successUrl: "https://product.test/changed",
    cancelUrl: "https://product.test/unchanged",
    checkService: "configured-check",
  });
  expect(html(value.selected)).toContain("connection-successUrl");
  expect(presetSelection("payments", options.capabilities).payments).toContain(
    "subscriptions",
  );
  expect(html(value.selected)).toContain("connection-scope");
});

test("generated configuration opens as an environment file", () => {
  const page = renderToStaticMarkup(
    <ConnectionConfigurationOutput configuration={{ PAYMENTS_PRODUCT: "product", PAYMENTS_URL: "https://payments.test" }} secretVariable="CLIENT_SECRET" />,
  );
  expect(page).toContain("Configuración del backend");
  expect(page).toContain("Copiar .env");
  expect(page).toContain("Descargar .env");
  expect(page).toContain('id="connection-output-format"');
  expect(page).toContain('tabindex="0"');
  expect(page).toContain("CLIENT_SECRET");
  expect(page).toContain("PAYMENTS_PRODUCT");
  expect(page).toContain("Archivo .env");
});

test("explicit JSON preview explains what its data is used for", () => {
  const page = renderToStaticMarkup(
    <ConnectionConfigurationOutput configuration={connectionPayload(draft({ payments: ["catalog"] }), options.capabilities)} preview />,
  );
  expect(page).toContain("JSON de la conexión");
  expect(page).toContain("Estos datos se enviarán a Console al guardar.");
  expect(page).toContain("&quot;capabilities&quot;");
  expect(page).not.toContain('id="connection-output-format"');
});

test("SDK delivery defaults to env without document selection variables", () => {
  const configuration = { PAYMENTS_CONNECTION: JSON.stringify({ issuer: "https://identity.test", clientId: "backend", legal: { baseUrl: "https://legal.test" } }) };
  const page = renderToStaticMarkup(<ConnectionConfigurationOutput configuration={configuration} secretVariable="HEMIA_CLIENT_SECRET" selection={{ payments: ["catalog"], legalAcceptances: ["collector"] }} />);
  for (const text of ["Archivo .env", "PAYMENTS_CONNECTION", "HEMIA_CLIENT_SECRET", "se administran en Console y Legal"]) expect(page).toContain(text);
  expect(page).toContain("# Configuración del backend generada por Hemia Console");
  expect(page).not.toContain("Ver contenido JSON");
  for (const removed of ["LEGAL_APPLICATION_ID", "LEGAL_DOCUMENT_IDS", "HEMIA_IDENTITY_ISSUER", "LEGAL_CONTEXT_JWKS_URL"]) expect(page).not.toContain(removed);
  const env = connectionEnv(configuration, "HEMIA_CLIENT_SECRET");
  expect(Object.keys(parseEnv(env))).toEqual(["PAYMENTS_CONNECTION", "HEMIA_CLIENT_SECRET"]);
  const raw = renderToStaticMarkup(<ConfigurationFileView content={env} env />);
  expect(raw).toContain("whitespace-pre-wrap");
  expect(raw).toContain('aria-hidden="true"');
});

test("delivery links to the selected OAuth client and folds secondary instructions", () => {
  const href = "/es/identity/oauth-clients/selected-client-id";
  const page = renderToStaticMarkup(<ConnectionDeliveryResult
    result={{ ready: false, status: "preview", steps: [], configuration: { PAYMENTS_CONNECTION: "{}" }, secretVariable: "HEMIA_CLIENT_SECRET" }}
    selection={{ payments: ["catalog"] }}
    oauthClient={{ name: "Cliente seleccionado", href }}
    onCheck={() => {}} onConfigure={() => {}}
  />);
  expect(page).toContain(`href="${href}"`);
  expect(page).toContain('target="_blank"');
  expect(page).toContain('rel="noopener noreferrer"');
  expect(page).toContain("Abrir cliente OAuth: Cliente seleccionado");
  expect(page).toContain("gestor de secretos de este entorno");
  expect(page).toContain("el anterior deja de funcionar");
  for (const summary of ["Si no tienes el secreto", "Cómo instalar la conexión"])
    expect(page).toMatch(new RegExp(`<details[^>]*><summary[^>]*>${summary}</summary>`));
  expect(page).not.toContain("<details open");
});

test("remote connection delivery contains four environment variables and keeps the full configuration under advanced options", () => {
  const reference = { configuration: { HEMIA_BASE_URL: "https://billing.test", HEMIA_CONNECTION: "product", HEMIA_CLIENT_ID: "backend" }, published: false, sdkVersion: "0.11.0" };
  const page = renderToStaticMarkup(<ConnectionDeliveryResult
    result={{ ready: false, status: "preview", steps: [], configuration: { PAYMENTS_CONNECTION: '{"productCode":"product"}' }, secretVariable: "HEMIA_CLIENT_SECRET", connectionReference: reference }}
    selection={{ payments: ["catalog"], legalAcceptances: ["collector"] }}
    onCheck={() => {}} onConfigure={() => {}}
  />);
  expect(Object.keys(parseEnv(connectionEnv(reference.configuration, "HEMIA_CLIENT_SECRET")))).toEqual(["HEMIA_BASE_URL", "HEMIA_CONNECTION", "HEMIA_CLIENT_ID", "HEMIA_CLIENT_SECRET"]);
  const main = page.split("Configuración avanzada")[0];
  expect(main).toContain("HEMIA_CONNECTION");
  expect(main).not.toContain("PAYMENTS_CONNECTION");
  for (const text of ["Guarda la conexión para publicar", "Comprueba su disponibilidad en npm", "npm install @hemia/payments@^", "resolvePaymentsConnection", "Descargar .env avanzado"]) expect(page).toContain(text);
  expect(page).not.toContain("versión local");
  expect(page).toMatch(/<details[^>]*><summary[^>]*>Configuración avanzada<\/summary>/);
});

test("downloaded env preserves JSON, hashes and literal escapes while leaving the secret empty", () => {
  const configuration = { PAYMENTS_CONNECTION: JSON.stringify({ productCode: "product", successUrl: "https://product.test/O'Reilly#done", note: "literal\\n" }), HEMIA_CLIENT_SECRET: "must-not-be-exported" };
  const output = connectionEnv(configuration, "HEMIA_CLIENT_SECRET");
  expect(parseEnv(output)).toEqual({ ...configuration, HEMIA_CLIENT_SECRET: "" });
  expect(output).not.toContain("must-not-be-exported");
  expect(() => connectionEnv({ "INVALID\nKEY": "value" })).toThrow();
});
test("env view folds Legal and receiver while the export and other values stay unchanged", () => {
  const connection = { issuer: "https://identity.test", receiver: { audience: "product-api", billingClientId: "billing-service" }, legal: { baseUrl: "https://legal.test", note: "O'Reilly#done", path: "literal\\n" } };
  const configuration = { PAYMENTS_CONNECTION: JSON.stringify(connection), OTHER_JSON: '{"compact":true}' };
  const env = connectionEnv(configuration, "HEMIA_CLIENT_SECRET");
  const page = renderToStaticMarkup(<ConfigurationFileView content={env} env />);
  const text = page.replace(/<[^>]*>/g, "");
  expect(text).toContain('&quot;issuer&quot;: &quot;https://identity.test&quot;');
  for (const key of ["legal", "receiver"])
    expect(page).toMatch(new RegExp(`<details[^>]*><summary[^>]*><span[^>]*>&quot;${key}&quot;</span>`));
  expect(page).not.toMatch(/<details[^>]*\sopen(?:=|\s|>)/);
  expect(text).toContain('&quot;baseUrl&quot;: &quot;https://legal.test&quot;');
  expect(text).toContain('&quot;billingClientId&quot;: &quot;billing-service&quot;');
  expect(text).toContain('&quot;path&quot;: &quot;literal\\\\n&quot;');
  for (const key of ["issuer", "legal", "receiver", "baseUrl", "audience", "billingClientId"])
    expect(page).toMatch(new RegExp(`<span(?=[^>]*tabindex="0")(?=[^>]*data-base-ui-tooltip-trigger)[^>]*>&quot;${key}&quot;</span>`));
  expect(text).not.toContain("Cliente de Billing autorizado");
  expect(page).toContain('{&quot;compact&quot;:true}');
  expect(parseEnv(env)).toEqual({ ...configuration, HEMIA_CLIENT_SECRET: "" });
  expect(env).toContain(`PAYMENTS_CONNECTION=\`${JSON.stringify(connection)}\`\n`);
  const malformed = "PAYMENTS_CONNECTION='{broken}'";
  expect(renderToStaticMarkup(<ConfigurationFileView content={malformed} env />)).toContain("&#x27;{broken}&#x27;");
  expect(renderToStaticMarkup(<ConfigurationFileView content={env} env={false} />)).not.toContain("<details");
});
test("registration and catalog require no callback and the delivery explains preview and checks", () => {
  const value = draft({ payments: ["catalog"], legalAcceptances: ["collector"] });
  value.legal = { applicationId: "app", documentIds: ["terms"] };
  value.payments.customServices = false;
  expect(configurationError(value, options.capabilities)).toBe("");
  expect(connectionPayload(value, options.capabilities).payments).not.toHaveProperty("backendBaseUrl");
  const page = renderToStaticMarkup(<ConnectionDeliveryResult selection={value.selected} result={{ ready: false, status: "preview", mode: "preview", steps: [{ name: "Aplicación y documentos", service: "Legal", kind: "configuration", state: "pending" }], configuration: { PAYMENTS_CONNECTION: JSON.stringify({ legal: { baseUrl: "https://legal.test" } }) }, secretVariable: "HEMIA_CLIENT_SECRET" }} onCheck={() => {}} onConfigure={() => {}} />);
  for (const text of ["Sin guardar", "Descargar .env", "Cómo instalar la conexión", "Comprobar conexión", "Corregir configuración", "no requieren un webhook"]) expect(page).toContain(text);
  expect(page).toContain("# Configuración del backend generada por Hemia Console");
  expect(page).toMatch(/<details[^>]*><summary[^>]*>Cambios al guardar<\/summary>/);
  expect(page).not.toContain("Configuración guardada");
});

test("technical review details are folded while configuration blockers remain visible", () => {
  const value = draft({ legalAcceptances: ["collector"] });
  const page = renderToStaticMarkup(<ConnectionReview options={options} value={value} systemName="Producto" newSystem={false} newClient={false} legal={legal} onEdit={() => {}} />);
  expect(page).toMatch(/<details[^>]*><summary[^>]*>Detalles técnicos<\/summary>[\s\S]*?Servicio de contexto[\s\S]*?Contexto[\s\S]*?<\/details>/);
  expect(page).not.toContain("<details open");
  expect(page).toContain("Selecciona la aplicación legal y sus documentos.");
  const pending = renderToStaticMarkup(<ConnectionDeliveryResult result={{ ready: false, status: "pending", steps: [{ name: "Conexión fallida", state: "pending", message: "Revisa el backend" }], configuration: {} }} selection={{}} onCheck={() => {}} onConfigure={() => {}} />);
  expect(pending).toContain('<details open=""');
  expect(pending).toContain("Revisa el backend");
});
