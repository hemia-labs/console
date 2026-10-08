import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { OAuthServiceDestinations } from "../src/features/identity-access/oauth-clients/oauth-service-destinations";

test("shows resources, audiences and scopes grouped by destination", () => {
  const html = renderToStaticMarkup(<OAuthServiceDestinations destinations={[
    { resource: "http://localhost:4000", audience: "identity-api", scopes: ["identity.tokens.introspect", "identity.oauth_clients.read"] },
    { resource: "http://localhost:3019", audience: "access-api", scopes: ["legal.consumer_context.read"] },
  ]} />);
  expect(html).toContain("http://localhost:4000");
  expect(html).toContain("http://localhost:3019");
  expect(html).toContain("identity.oauth_clients.read");
  expect(html.indexOf("identity.tokens.introspect")).toBeGreaterThan(html.indexOf("identity-api"));
  expect(html.indexOf("identity.tokens.introspect")).toBeLessThan(html.indexOf("access-api"));
  expect(html.indexOf("legal.consumer_context.read")).toBeGreaterThan(html.indexOf("access-api"));
});

test("does not show a destination model for legacy clients", () => {
  for (const destinations of [undefined, null, []]) expect(renderToStaticMarkup(<OAuthServiceDestinations destinations={destinations} />)).toBe("");
});
