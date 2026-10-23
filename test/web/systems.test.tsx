import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { SystemList } from "../../apps/web/src/features/systems/system-list";
import { SystemForm } from "../../apps/web/src/features/systems/system-form";
import { ConfigurationField } from "../../apps/web/src/features/systems/catalog-fields";
import { SystemServicesForm } from "../../apps/web/src/features/systems/system-services-form";
import { CapabilityList } from "../../apps/web/src/features/systems/capability-list";
import { CapabilityForm } from "../../apps/web/src/features/systems/capability-form";
import {
  readConfiguration,
  readSchema,
  type Capability,
  type CatalogChoices,
} from "../../apps/web/src/features/systems/types";
const capabilities: Capability[] = [
  {
    code: "notifications",
    name: "Notificaciones",
    schema: {
      fields: [
        {
          key: "mode",
          label: "Modo de entrega",
          type: "string",
          options: ["test", "live"],
          required: true,
        },
        {
          key: "retries",
          label: "Reintentos",
          type: "integer",
          min: 0,
          max: 10,
        },
        { key: "enabled", label: "Enviar avisos", type: "boolean" },
      ],
    },
  },
];
const scopeEntries = [
  "legal.integration.acceptances.prepare",
  "legal.integration.acceptances.create",
  "legal.integration.acceptances.validate",
].map((code, index) => ({
  id: `scope-${index}`,
  code,
  audience: "legal-api",
  name: code,
  description: "",
  resource: "https://legal.example",
  enabled: true,
}));
const collectorFunction = {
  code: "collector",
  name: "Registrar aceptaciones",
  scopes: scopeEntries
    .slice(0, 2)
    .map(({ code, audience }) => ({ code, audience })),
};
const validatorFunction = {
  code: "validator",
  name: "Validar evidencia",
  scopes: scopeEntries
    .slice(2)
    .map(({ code, audience }) => ({ code, audience })),
};
const legalCapability: Capability = {
  code: "legalAcceptances",
  name: "Aceptaciones legales",
  schema: {
    fields: [
      { key: "identityIssuer", label: "Identidad de origen", type: "string" },
      { key: "productCode", label: "Producto", type: "string" },
      {
        key: "contextService",
        label: "Servicio de verificación",
        type: "string",
        format: "service",
      },
    ],
  },
  functions: [collectorFunction, validatorFunction],
};
const choices: CatalogChoices = {
  scopes: scopeEntries,
  audiences: ["support-api"],
  verificationClientId: "legal-service-dev",
  clients: [
    {
      clientId: "collector",
      oauthIssuer: "https://identity.example",
      name: "Balanz",
      serviceDestinations: [
        {
          resource: "https://legal.example",
          audience: "legal-api",
          scopes: scopeEntries.slice(0, 2).map((s) => s.code),
        },
      ],
      scopes: [
        "legal.integration.acceptances.prepare",
        "legal.integration.acceptances.create",
      ],
    },
    {
      clientId: "validator",
      oauthIssuer: "https://identity.example",
      name: "Billing",
      serviceDestinations: [
        {
          resource: "https://legal.example",
          audience: "legal-api",
          scopes: scopeEntries.slice(2).map((s) => s.code),
        },
      ],
      scopes: ["legal.integration.acceptances.validate"],
    },
  ],
};
test("generates selects, numeric inputs and checkboxes from capability fields", () => {
  const html = renderToStaticMarkup(
    <SystemForm
      system={{
        id: "system",
        code: "balanz",
        name: "Balanz",
        enabled: true,
        configuration: {
          notifications: { mode: "test", retries: 0, enabled: false },
        },
        services: [],
        clients: [],
      }}
      capabilities={capabilities}
      choices={choices}
      onSave={async () => {}}
      cancelHref="/es/catalogs/systems"
    />,
  );
  expect(html).toContain("Modo de entrega");
  expect(html).toContain('role="combobox"');
  expect(html).toContain('type="number"');
  expect(html).toContain("Enviar avisos");
  expect(html).toContain("JSON avanzado");
});
test("capability administration has field and validation controls", () => {
  const html = renderToStaticMarkup(
    <CapabilityForm
      capability={capabilities[0]}
      onSave={async () => {}}
      cancelHref="/es/catalogs/system-capabilities"
    />,
  );
  expect(html).toContain("Campo obligatorio");
  expect(html).toContain("Longitud máxima");
  expect(html).toContain("Opciones");
  expect(html).toContain("Mínimo");
  expect(html).toContain("Agregar campo");
});
test("advanced JSON retains scalar values and rejects malformed shapes", () => {
  expect(
    readConfiguration('{"notifications":{"enabled":false,"retries":0}}'),
  ).toEqual({ notifications: { enabled: false, retries: 0 } });
  expect(readSchema(JSON.stringify(capabilities[0].schema))).toEqual(
    capabilities[0].schema,
  );
  for (const value of ["[]", "null", '{"mode":"test"}'])
    expect(() => readConfiguration(value)).toThrow();
  expect(() =>
    readSchema(
      '{"fields":[{"key":"invalid","label":"Invalid","type":"object"}]}',
    ),
  ).toThrow();
});

test("capability overview exposes required fields and a bounded preview", () => {
  const html = renderToStaticMarkup(
    <CapabilityList
      capabilities={[
        {
          ...capabilities[0],
          schema: {
            fields: [
              ...capabilities[0].schema.fields,
              { key: "notes", label: "Notas internas", type: "string" },
            ],
          },
        },
      ]}
      listHref="/es/catalogs/system-capabilities"
    />,
  );
  expect(html).toContain("1 obligatorio");
  expect(html).toContain("Selección");
  expect(html).toContain("1 campo más");
  expect(html).not.toContain("Notas internas");
  expect(html).toContain('aria-label="Editar esquema de Notificaciones"');
  expect(html).toContain(
    'href="/es/catalogs/system-capabilities/notifications/edit"',
  );
  expect(html).not.toContain('role="button"');
});
test("empty capability catalog explains how to get started", () => {
  const html = renderToStaticMarkup(
    <CapabilityList
      capabilities={[]}
      listHref="/es/catalogs/system-capabilities"
    />,
  );
  expect(html).toContain("Aún no hay capacidades");
  expect(html).toContain("Crea una capacidad");
});

test("systems link to their own edit page using the immutable ID", () => {
  const html = renderToStaticMarkup(
    <SystemList
      listHref="/es/catalogs/systems"
      capabilities={capabilities}
      systems={[
        {
          id: "system-id",
          code: "balanz",
          name: "Balanz",
          enabled: true,
          configuration: { notifications: {} },
          services: [],
          clients: [],
        },
      ]}
    />,
  );
  expect(html).toContain('href="/es/catalogs/systems/system-id/edit"');
  expect(html).toContain('aria-label="Editar sistema Balanz"');
  expect(html).toContain("Notificaciones");
  expect(html).not.toContain('role="button"');
  expect(html).not.toContain("<form");
});
test("empty systems list explains how to start without embedding a form", () => {
  const html = renderToStaticMarkup(
    <SystemList
      listHref="/es/catalogs/systems"
      capabilities={[]}
      systems={[]}
    />,
  );
  expect(html).toContain("No hay sistemas registrados");
  expect(html).not.toContain("<form");
});

test("system overview counts client states without assuming a legal workflow", () => {
  const html = renderToStaticMarkup(
    <SystemList
      listHref="/es/catalogs/systems"
      capabilities={[]}
      systems={[
        {
          id: "disabled",
          code: "balanz",
          name: "Balanz",
          enabled: false,
          configuration: {},
          services: [],
          clients: [
            {
              clientId: "collector",
              oauthIssuer: "https://identity.example",
              capabilityCode: "legalAcceptances",
              roles: ["collector"],
              enabled: true,
            },
            {
              clientId: "disabled-collector",
              oauthIssuer: "https://identity.example",
              capabilityCode: "legalAcceptances",
              roles: ["collector"],
              enabled: false,
            },
            {
              clientId: "validator",
              oauthIssuer: "https://identity.example",
              capabilityCode: "legalAcceptances",
              roles: ["validator"],
              enabled: true,
            },
          ],
        },
      ]}
    />,
  );
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  expect(text).toContain("Deshabilitado");
  expect(text).toContain("2 de 3 habilitados");
  expect(text).toContain("Habilitados 2");
  expect(text).not.toContain("Registran aceptaciones");
  expect(text).toContain("Deshabilitados 1");
  expect(text).not.toContain("Validan evidencia");
  expect(text).toContain("Sin capacidades configuradas.");
});
test("system capability previews stay bounded and explain missing client configuration", () => {
  const html = renderToStaticMarkup(
    <SystemList
      listHref="/es/catalogs/systems"
      capabilities={[]}
      systems={[
        {
          id: "system",
          code: "balanz",
          name: "Balanz",
          enabled: true,
          services: [],
          clients: [],
          configuration: { first: {}, second: {}, third: {}, fourth: {} },
        },
      ]}
    />,
  );
  expect(html).toContain("third");
  expect(html).not.toContain("fourth");
  expect(html).toContain("+1 más");
  expect(html).toContain("Sin clientes configurados.");
});

test("non-legal systems render their dynamic schema without legal client controls", () => {
  const html = renderToStaticMarkup(
    <SystemForm
      system={{
        id: "portal",
        code: "support_portal",
        name: "Portal de soporte",
        enabled: true,
        configuration: {
          notifications: { mode: "test", retries: 0, enabled: false },
        },
        services: [],
        clients: [],
      }}
      capabilities={capabilities}
      choices={choices}
      onSave={async () => {}}
      cancelHref="/es/catalogs/systems"
    />,
  );
  expect(html).toContain("Portal de soporte");
  expect(html).toContain("Modo de entrega");
  expect(html).toContain("Reintentos");
  expect(html).not.toContain("Clientes de aceptaciones legales");
  expect(html).not.toContain("Registrar aceptaciones");
  expect(html).not.toContain("Balanz");
});
test("legal client setup is scoped to its capability and kept for existing clients", () => {
  for (const configuration of [{ legalAcceptances: {} }, {}]) {
    const html = renderToStaticMarkup(
      <SystemForm
        system={{
          id: "portal",
          code: "support_portal",
          name: "Portal de soporte",
          enabled: true,
          configuration,
          services: [],
          clients: [
            {
              clientId: "collector",
              oauthIssuer: "https://identity.example",
              capabilityCode: "legalAcceptances",
              roles: ["collector"],
              enabled: true,
            },
          ],
        }}
        capabilities={[...capabilities, legalCapability]}
        choices={choices}
        onSave={async () => {}}
        cancelHref="/es/catalogs/systems"
      />,
    );
    expect(html).toContain("Clientes del sistema");
    expect(html).toContain("Registrar aceptaciones");
    expect(html).toContain("Cliente habilitado");
  }
});

test("service fields use the current system services and stay unselected on creation", () => {
  const field = {
    key: "delivery",
    label: "Servicio de entrega",
    type: "string" as const,
    format: "service" as const,
    required: true,
  };
  const html = renderToStaticMarkup(
    <ConfigurationField
      id="delivery"
      field={field}
      value="delivery-api"
      onChange={() => {}}
      services={[
        {
          code: "delivery-api",
          name: "Entrega de soporte",
          url: "https://support.example/custom",
          audience: "support-api",
          resource: "https://support.example",
          enabled: true,
        },
      ]}
    />,
  );
  expect(html).toContain('role="combobox"');
  expect(html).toContain("Entrega de soporte");
  expect(html).not.toContain('type="url"');
  const empty = renderToStaticMarkup(
    <ConfigurationField
      id="delivery"
      field={field}
      value={undefined}
      onChange={() => {}}
      services={[]}
    />,
  );
  expect(empty).toContain("Sin servicios disponibles");
  expect(empty).toContain("Completa nombre, código y URL");
  expect(empty).not.toContain("localhost:3021");
});
test("service forms protect services in use and expose named inputs without requiring JSON", () => {
  const html = renderToStaticMarkup(
    <SystemServicesForm
      audiences={["support-api"]}
      services={[
        {
          code: "check",
          name: "Verificación de soporte",
          url: "https://support.example/check",
          audience: "support-api",
          resource: "https://support.example",
          enabled: true,
        },
      ]}
      usage={{ check: ["Notificaciones"] }}
      onAddService={() => {}}
      onChange={() => {}}
    />,
  );
  expect(html).toContain("URL del servicio");
  expect(html).toContain("Agregar servicio");
  expect(html).toContain("En uso por: Notificaciones");
  expect(html).toContain('readOnly=""');
  expect(html).toContain(
    'aria-label="Eliminar servicio Verificación de soporte"',
  );
  expect(html).toContain('disabled=""');
  expect(html).not.toContain("textarea");
});

const verificationService = {
  code: "check",
  name: "Verificación de soporte",
  url: "https://support.example/check",
  enabled: true,
  audience: "support-api",
  resource: "https://support.example",
};
test("generic service forms do not expose Legal or OAuth authorization", () => {
  const html = renderToStaticMarkup(
    <SystemServicesForm
      audiences={["support-api"]}
      services={[verificationService]}
      usage={{}}
      onAddService={() => {}}
      onChange={() => {}}
    />,
  );
  expect(html).toContain("URL del servicio");
  expect(html).not.toContain("Legal");
  expect(html).toContain("API receptora");
});

test("incomplete and disabled services are excluded and the empty field offers an add action", () => {
  const html = renderToStaticMarkup(
    <ConfigurationField
      id="service-field"
      field={{
        key: "service",
        label: "Servicio",
        type: "string",
        format: "service",
        required: true,
      }}
      value={undefined}
      services={[
        { ...verificationService, url: "" },
        { ...verificationService, enabled: false },
      ]}
      onChange={() => {}}
      onAddService={() => {}}
    />,
  );
  expect(html).toContain("Sin servicios disponibles");
  expect(html).toContain("Completa nombre, código y URL");
  expect(html).toContain("Agregar servicio");
});

test("legal capability exposes its schema, contextual authorization and Identity guidance for a different system", () => {
  const html = renderToStaticMarkup(
    <SystemForm
      system={{
        id: "portal",
        code: "portal",
        name: "Portal de soporte",
        enabled: true,
        configuration: { legalAcceptances: { contextService: "check" } },
        services: [verificationService],
        clients: [
          {
            oauthIssuer: "https://identity.example",
            clientId: "",
            capabilityCode: "legalAcceptances",
            roles: ["collector"],
            enabled: true,
          },
        ],
      }}
      capabilities={[
        {
          code: "legalAcceptances",
          name: "Aceptaciones legales",
          schema: {
            fields: [
              {
                key: "identityIssuer",
                label: "Identidad de origen",
                type: "string",
              },
              { key: "productCode", label: "Producto", type: "string" },
              {
                key: "contextService",
                label: "Servicio de verificación",
                type: "string",
                format: "service",
              },
            ],
          },
        },
      ]}
      choices={choices}
      onSave={async () => {}}
      cancelHref="/es/catalogs/systems"
      identityClientsHref="/es/identity/oauth-clients"
    />,
  );
  expect(html).toContain('id="config-legalAcceptances-identityIssuer"');
  expect(html).toContain('id="config-legalAcceptances-productCode"');
  expect(html).toContain('id="config-legalAcceptances-contextService"');
  expect(html).not.toContain("Autorizar consultas de Legal");
  expect(html).toContain("Administrar clientes en Identity");
  expect(html).toContain(
    "Reutiliza el cliente del backend. Al guardar se asignan los permisos seleccionados.",
  );
});
