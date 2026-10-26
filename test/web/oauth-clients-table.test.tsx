import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { OAuthClientsTable } from "../../apps/web/src/features/identity-access/oauth-clients/oauth-clients-table";
import type { IdentityOAuthClient } from "../../apps/web/src/features/identity-access/oauth-clients/types";

function client(overrides: Partial<IdentityOAuthClient> = {}): IdentityOAuthClient {
  return {
    id: "30426a5a-d6de-4fb0-8cf2-7f7537e35458",
    clientId: "console",
    audience: "console-api",
    type: "confidential",
    serviceDestinations: null,
    ...overrides,
  };
}

function render(clients: IdentityOAuthClient[]) {
  return renderToStaticMarkup(
    <OAuthClientsTable
      clients={clients}
      locale="es"
      onDelete={() => {}}
      onRotateSecret={() => {}}
      onStatus={() => {}}
      pendingClientId={null}
    />,
  );
}

test("clamps destinations and scopes with a remaining counter per row", () => {
  const html = render([
    client({
      clientId: "many-destinations",
      serviceDestinations: [
        { resource: "http://localhost:4000", audience: "identity-api", scopes: ["identity.tokens.introspect"] },
        { resource: "http://localhost:3019", audience: "access-api", scopes: ["legal.consumer_context.read"] },
        { resource: "http://localhost:3020", audience: "billing-api", scopes: ["billing.invoices.read"] },
      ],
    }),
  ]);

  expect(html).toContain("identity-api");
  expect(html).toContain("access-api");
  expect(html).not.toContain(">billing-api<");
  expect(html).toContain("+1 destino más");
  expect(html).toContain("+1 scope más");
  expect(html).toContain("billing-api · http://localhost:3020");
  expect(html).toContain("billing.invoices.read");
});

test("renders every item when lists fit within the visible limit", () => {
  const html = render([
    client({
      clientId: "compact",
      scopes: ["console.read", "console.write"],
    }),
  ]);

  expect(html).toContain("console.read");
  expect(html).toContain("console.write");
  expect(html).not.toContain("más");
});

test("falls back to the plain audience and empty scope hint for legacy clients", () => {
  const html = render([client({ clientId: "legacy", audience: "console-api" })]);

  expect(html).toContain("console-api");
  expect(html).toContain("Sin scopes");
});
