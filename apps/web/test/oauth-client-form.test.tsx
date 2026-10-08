import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { OAuthClientForm, initialState, buildPayload, validateDestinationForm } from "../src/features/identity-access/oauth-clients/oauth-client-form";
import { addOAuthScope } from "../src/features/identity-access/oauth-clients/oauth-client-utils";
import type { IdentityOAuthClient } from "../src/features/identity-access/oauth-clients/types";

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
    <OAuthClientForm client={value} mode="edit" cancelHref="/es/identity/oauth-clients/detail" onSubmit={async () => {}} pending={pending} />
  );
}

describe("OAuth client editing", () => {
  test("does not preselect new permissions or flows for existing empty lists", () => {
    const html = render();
    expect(html).toContain("Selecciona los flujos");
    expect(html).toContain("Selecciona los tipos de respuesta");
    expect(html).toContain("Selecciona los permisos");
    expect(html).not.toContain("offline_access");
    expect(html).not.toContain("authorization_code");
  });

  test("retains existing custom scopes and OAuth response combinations", () => {
    const html = render({ ...client, scopes: ["console.access"], responseTypes: ["code id_token"] });
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
    const result = addOAuthScope(scopes, "  billing.integration.checkout.create  ");
    expect(result).toEqual({ scopes: [...scopes, "billing.integration.checkout.create"], error: null });
    expect(scopes).toEqual(["billing.integration.catalog.read"]);
    expect(addOAuthScope(result.scopes, "billing.integration.checkout.read").scopes).toHaveLength(3);
  });

  test("rejects blank scopes, internal whitespace and duplicates", () => {
    const scopes = ["billing.integration.checkout.create"];
    for (const value of ["", "   ", "billing read", "billing\tread", "billing\nread", " billing.integration.checkout.create "]) {
      const result = addOAuthScope(scopes, value);
      expect(result.error).not.toBeNull();
      expect(result.scopes).toBe(scopes);
    }
  });

  test("provides an accessible custom scope input and removal controls", () => {
    const html = render({ ...client, scopes: ["billing.integration.checkout.create"] });
    expect(html).toContain('for="customScope"');
    expect(html).toContain('id="customScope"');
    expect(html).toContain('aria-label="Quitar permiso billing.integration.checkout.create"');
    expect(html).toContain('>Agregar<');
  });
});

describe("OAuth destination model", () => {
  const destinations = [
    { resource: "http://localhost:4000", audience: "identity-api", scopes: ["identity.tokens.introspect", "identity.oauth_clients.read"] },
    { resource: "http://localhost:3019", audience: "access-api", scopes: ["legal.consumer_context.read"] },
  ];
  const serviceClient = { ...client, audience: "identity-api", grantTypes: ["client_credentials"], serviceDestinations: destinations };
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
    expect(html).toContain('id="destination-custom-scope-0"');
    expect(html).toContain('id="destination-custom-scope-1"');
    expect(html).toContain('aria-label="Quitar permiso identity.tokens.introspect"');
    expect(html).toContain('aria-label="Quitar permiso legal.consumer_context.read"');
    expect(html).not.toContain('textarea id="destination-scopes-');
  });
  test("builds a new service client with explicit destination permissions", () => {
    const state = { ...initialState(), destinationMode: true, serviceDestinations: destinations };
    expect(validateDestinationForm(state)).toBeNull();
    expect(buildPayload(state).serviceDestinations).toEqual(destinations);
  });
  test("rejects malformed, duplicated and incompatible destinations", () => {
    const state = initialState(serviceClient);
    for (const invalid of [
      { serviceDestinations: [] },
      { serviceDestinations: [destinations[0], destinations[0]] },
      { serviceDestinations: [{ ...destinations[0], resource: "ftp://example.com" }] },
      { serviceDestinations: [{ ...destinations[0], resource: "https://example.com/#fragment" }] },
      { serviceDestinations: [{ ...destinations[0], scopes: ["invalid scope"] }] },
      { type: "public" as const },
      { grantTypes: ["authorization_code"] },
    ]) expect(validateDestinationForm({ ...state, ...invalid })).not.toBeNull();
  });
  test("clears destination policies only when changing the model explicitly", () => {
    expect(buildPayload({ ...initialState(serviceClient), destinationMode: false }).serviceDestinations).toBeNull();
    expect(buildPayload(initialState(client))).not.toHaveProperty("serviceDestinations");
  });
});
