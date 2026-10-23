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
  configurationError,
  initialDraft,
  needs,
  presetSelection,
  schemaFields,
  selectFunction,
  reusableClients,
  type ConnectionOptions,
} from "../../apps/web/src/features/systems/connections-model";
import { CapabilityForm } from "../../apps/web/src/features/systems/capability-form";
import { readSchema } from "../../apps/web/src/features/systems/types";
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
  expect(page).toContain("connection-product");
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
  expect(initial).toContain("sin Hemia Legal ni legalAcceptanceId");
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
  expect(page).toContain("connection-notifications-channel");
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
  expect(page).toContain('value="urn:hemia:product"');
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

test("generated configuration is readable JSON with a separate environment format", () => {
  const page = renderToStaticMarkup(
    <ConnectionConfigurationOutput configuration={{ PAYMENTS_PRODUCT: "product", PAYMENTS_URL: "https://payments.test" }} secretVariable="CLIENT_SECRET" />,
  );
  expect(page).toContain("Configuración del backend");
  expect(page).toContain("Copiar JSON");
  expect(page).toContain('id="connection-output-format"');
  expect(page).toContain('tabindex="0"');
  expect(page).toContain("CLIENT_SECRET");
  expect(page).toContain("&quot;PAYMENTS_PRODUCT&quot;: &quot;product&quot;");
});

test("review shows its JSON before saving and explains what it is used for", () => {
  const page = renderToStaticMarkup(
    <ConnectionConfigurationOutput configuration={connectionPayload(draft({ payments: ["catalog"] }), options.capabilities)} preview />,
  );
  expect(page).toContain("JSON de la conexión");
  expect(page).toContain("Estos datos se enviarán a Console al guardar.");
  expect(page).toContain("&quot;capabilities&quot;");
  expect(page).not.toContain('id="connection-output-format"');
});
