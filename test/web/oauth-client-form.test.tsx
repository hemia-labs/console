import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  OAuthClientForm,
  initialState,
  buildPayload,
  validateDestinationForm,
} from "../../apps/web/src/features/identity-access/oauth-clients/oauth-client-form";
import { resolveApiScopes } from "../../apps/web/src/features/oauth-scopes/types";
import { addOAuthScope } from "../../apps/web/src/features/identity-access/oauth-clients/oauth-client-utils";
import type { IdentityOAuthClient } from "../../apps/web/src/features/identity-access/oauth-clients/types";

const client: IdentityOAuthClient = {
  id: "30426a5a-d6de-4fb0-8cf2-7f7537e35458",
  clientId: "console",
  audience: "console-api",
  type: "confidential",
  grantTypes: [],
  responseTypes: [],
  scopes: [],
};

function render(value = client, pending = false) {
  return renderToStaticMarkup(
    <OAuthClientForm
      client={value}
      mode="edit"
      cancelHref="/es/identity/oauth-clients/detail"
      onSubmit={async () => {}}
      pending={pending}
    />,
  );
}

describe("OAuth client editing", () => {
  test("does not preselect new permissions or flows for existing empty lists", () => {
    const html = render();
    expect(html).toContain("Selecciona los flujos");
    expect(html).toContain("Selecciona los tipos de respuesta");
    expect(html).toContain("Buscar por nombre, scope o API");
    expect(html).toContain("0 seleccionados");
    expect(html).not.toContain("authorization_code");
  });

  test("does not invent or preselect protocol scopes when the catalog is empty", () => {
    const html = renderToStaticMarkup(
      <OAuthClientForm
        cancelHref="/es/identity/oauth-clients"
        mode="create"
        onSubmit={async () => {}}
      />,
    );
    expect(initialState().scopes).toEqual([]);
    expect(html).not.toContain("openid");
    expect(html).toContain("0 seleccionados");
  });
  test("shows protocol scopes once from Identity and only the primary API's permissions", () => {
    const html = renderToStaticMarkup(
      <OAuthClientForm
        client={client}
        cancelHref="/"
        mode="edit"
        onSubmit={async () => {}}
        scopeCatalog={[
          {
            id: "oidc",
            code: "openid",
            name: "Iniciar sesión",
            description: "",
            kind: "protocol",
            enabled: true,
          },
          {
            id: "read",
            code: "console.read",
            name: "Leer consola",
            description: "",
            kind: "api",
            enabled: true,
          },
          {
            id: "bill",
            code: "billing.read",
            name: "Leer billing",
            description: "",
            kind: "api",
            enabled: true,
          },
        ]}
        apiCatalog={[
          {
            id: "console",
            name: "Console",
            audience: "console-api",
            resource: "https://console",
            scopes: ["console.read"],
            enabled: true,
          },
        ]}
      />,
    );
    expect(html.match(/openid/g)).toHaveLength(1);
    expect(html).toContain("Leer consola");
    expect(html).not.toContain("Leer billing");
    expect(html).toContain("API principal");
    expect(html).toContain('id="primary-api-url"');
    expect(html).toContain('value="https://console"');
    const protocolSection = html.slice(
      html.indexOf('for="protocol-scopes"'),
      html.indexOf('for="scopes"'),
    );
    const apiSection = html.slice(html.indexOf('for="scopes"'));
    expect(protocolSection).toContain("openid");
    expect(protocolSection).not.toContain("Leer consola");
    expect(apiSection).toContain("Leer consola");
    expect(apiSection).not.toContain("Iniciar sesión");
    expect(html).not.toContain('type="text" id="audience"');
  });
  test("resolves API context without cloning protocol definitions", () => {
    const refs = resolveApiScopes(
      [
        {
          id: "oidc",
          code: "openid",
          name: "Login",
          description: "",
          kind: "protocol",
          enabled: true,
        },
        {
          id: "read",
          code: "read",
          name: "Read",
          description: "",
          kind: "api",
          enabled: true,
        },
      ],
      [
        {
          id: "one",
          name: "One",
          audience: "one-api",
          resource: "https://one",
          enabled: true,
          scopes: ["read"],
        },
        {
          id: "two",
          name: "Two",
          audience: "two-api",
          resource: "https://two",
          enabled: false,
          scopes: ["read"],
        },
      ],
    );
    expect(refs.map((s) => [s.code, s.audience, s.enabled])).toEqual([
      ["read", "one-api", true],
      ["read", "two-api", false],
    ]);
  });

  test("retains existing custom scopes and OAuth response combinations", () => {
    const html = render({
      ...client,
      scopes: ["console.access"],
      responseTypes: ["code id_token"],
    });
    expect(html).toContain("console.access");
    expect(html).toContain("code id_token");
  });

  test("disables editing and cancellation while saving", () => {
    const html = render(client, true);
    expect(html).toContain('<fieldset disabled=""');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('aria-disabled="true"');
  });
});

describe("Custom OAuth scopes", () => {
  test("adds trimmed Billing scopes without changing the original selection", () => {
    const scopes = ["billing.integration.catalog.read"];
    const result = addOAuthScope(
      scopes,
      "  billing.integration.checkout.create  ",
    );
    expect(result).toEqual({
      scopes: [...scopes, "billing.integration.checkout.create"],
      error: null,
    });
    expect(scopes).toEqual(["billing.integration.catalog.read"]);
    expect(
      addOAuthScope(result.scopes, "billing.integration.checkout.read").scopes,
    ).toHaveLength(3);
  });

  test("rejects blank scopes, internal whitespace and duplicates", () => {
    const scopes = ["billing.integration.checkout.create"];
    for (const value of [
      "",
      "   ",
      "billing read",
      "billing\tread",
      "billing\nread",
      " billing.integration.checkout.create ",
    ]) {
      const result = addOAuthScope(scopes, value);
      expect(result.error).not.toBeNull();
      expect(result.scopes).toBe(scopes);
    }
  });

  test("uses the catalog picker instead of manual scope inputs", () => {
    const html = render({
      ...client,
      scopes: ["billing.integration.checkout.create"],
    });
    expect(html).toContain('aria-label="Buscar permisos"');
    expect(html).not.toContain('id="customScope"');
    expect(html).toContain("billing.integration.checkout.create");
  });
});

describe("OAuth destination model", () => {
  const destinations = [
    {
      resource: "http://localhost:4000",
      audience: "identity-api",
      scopes: ["identity.tokens.introspect", "identity.oauth_clients.read"],
    },
    {
      resource: "http://localhost:3019",
      audience: "access-api",
      scopes: ["legal.consumer_context.read"],
    },
  ];
  const serviceClient = {
    ...client,
    audience: "identity-api",
    grantTypes: ["client_credentials"],
    serviceDestinations: destinations,
  };
  test("retains destinations on edit without flattening service scopes", () => {
    const state = initialState(serviceClient);
    expect(validateDestinationForm(state)).toBeNull();
    expect(buildPayload(state).serviceDestinations).toEqual(destinations);
    expect(buildPayload(state).scopes).toEqual([]);
    const html = render(serviceClient);
    expect(html).toContain("http://localhost:4000");
    expect(html).toContain("http://localhost:3019");
    expect(html).toContain("legal.consumer_context.read");
    expect(html).toContain("Agregar destino");
    expect(html).toContain('id="destination-scopes-0"');
    expect(html).toContain('id="destination-scopes-1"');
    expect(html).toContain("identity.tokens.introspect");
    expect(html).toContain("legal.consumer_context.read");
    expect(html).not.toContain('textarea id="destination-scopes-');
  });
  test("builds a new service client with explicit destination permissions", () => {
    const state = {
      ...initialState(),
      destinationMode: true,
      serviceDestinations: destinations,
    };
    expect(validateDestinationForm(state)).toBeNull();
    expect(buildPayload(state).serviceDestinations).toEqual(destinations);
  });
  test("rejects malformed, duplicated and incompatible destinations", () => {
    const state = initialState(serviceClient);
    for (const invalid of [
      { serviceDestinations: [] },
      { serviceDestinations: [destinations[0], destinations[0]] },
      {
        serviceDestinations: [
          { ...destinations[0], resource: "ftp://example.com" },
        ],
      },
      {
        serviceDestinations: [
          { ...destinations[0], resource: "https://example.com/#fragment" },
        ],
      },
      {
        serviceDestinations: [
          { ...destinations[0], scopes: ["invalid scope"] },
        ],
      },
      { type: "public" as const },
      { grantTypes: ["refresh_token"] },
    ])
      expect(validateDestinationForm({ ...state, ...invalid })).not.toBeNull();
  });
  test("clears destination policies only when changing the model explicitly", () => {
    expect(
      buildPayload({ ...initialState(serviceClient), destinationMode: false })
        .serviceDestinations,
    ).toBeNull();
    expect(buildPayload(initialState(client))).not.toHaveProperty(
      "serviceDestinations",
    );
  });
});
