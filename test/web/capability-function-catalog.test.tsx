import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ScopePicker } from "../../apps/web/src/features/oauth-scopes/scope-picker";
import { CapabilityFunctionsForm } from "../../apps/web/src/features/systems/capability-functions-form";
import { SystemClientsForm } from "../../apps/web/src/features/systems/system-clients-form";
import { type CatalogChoices } from "../../apps/web/src/features/systems/types";
const scope = {
  id: "scope",
  kind: "api" as const,
  code: "notifications.messages.send",
  audience: "notifications-api",
  name: "Enviar mensajes",
  description: "Enviar notificaciones al usuario",
  resource: "https://notifications.example",
  enabled: true,
};
const fn = {
  code: "sender",
  name: "Enviar notificaciones",
  scopes: [{ code: scope.code, audience: scope.audience }],
};
const capability = {
  code: "notifications",
  name: "Notificaciones",
  functions: [fn],
  schema: { fields: [] },
};
const choices: CatalogChoices = {
  scopes: [scope],
  verificationClientId: "legal",
  audiences: [],
  clients: [],
};
test("scope picker supports search, descriptive labels and explicit selection", () => {
  const html = renderToStaticMarkup(
    <ScopePicker id="scopes" scopes={[scope]} value={[]} onChange={() => {}} />,
  );
  expect(html).toContain('aria-label="Buscar permisos"');
  expect(html).toContain("Enviar mensajes");
  expect(html).toContain(scope.code);
  expect(html).not.toContain('checked=""');
});
test("capability functions select registered scopes without manual scope input", () => {
  const html = renderToStaticMarkup(
    <CapabilityFunctionsForm
      functions={[fn]}
      scopes={[scope]}
      onChange={() => {}}
    />,
  );
  expect(html).toContain("Funciones y permisos");
  expect(html).toContain("Enviar notificaciones");
  expect(html).toContain("Enviar mensajes");
  expect(html).toContain('checked=""');
});
test("system clients use any configured capability and function and offer Identity creation", () => {
  const html = renderToStaticMarkup(
    <SystemClientsForm
      clients={[
        {
          capabilityCode: "notifications",
          roles: ["sender"],
          clientId: "",
          oauthIssuer: "",
          enabled: true,
        },
      ]}
      capabilities={[capability]}
      configuration={{ notifications: {} }}
      choices={choices}
      systemCode="portal"
      onChange={() => {}}
      onBusyChange={() => {}}
      onSecretPending={() => {}}
    />,
  );
  expect(html).toContain("Notificaciones");
  expect(html).toContain("Enviar notificaciones");
  expect(html).toContain("Crear cliente en Identity");
  expect(html).toContain(scope.code);
  expect(html).not.toContain("Registrar aceptaciones");
  expect(html).not.toContain("Billing");
});

test("protocol scope labels show their code without suggesting an API audience", () => {
  const html = renderToStaticMarkup(
    <ScopePicker
      id="protocol"
      scopes={[
        {
          ...scope,
          kind: "protocol",
          code: "address",
          name: "Dirección del usuario",
          description: "Claims de dirección OIDC.",
        },
      ]}
      value={[]}
      onChange={() => {}}
    />,
  );
  expect(html).not.toContain("Dirección del usuario");
  expect(html).toContain("address");
  expect(html).not.toContain("Scope:");
  expect(html).not.toContain("API:");
  expect(html).not.toContain(scope.audience);
  expect(html).not.toContain("Claims de dirección OIDC.");
});

test("API scope labels distinguish the scope code from its audience", () => {
  const html = renderToStaticMarkup(
    <ScopePicker
      id="api-permissions"
      scopes={[scope]}
      value={[]}
      onChange={() => {}}
    />,
  );
  expect(html).toContain(scope.code);
  expect(html).not.toContain("Scope:");
  expect(html).toContain(scope.audience);
});

test("scope codes matching their name are displayed only once", () => {
  for (const kind of ["protocol", "api"] as const) {
    const html = renderToStaticMarkup(
      <ScopePicker
        id="matching"
        scopes={[
          {
            ...scope,
            kind,
            name: "address",
            code: "address",
            description: "Descripción",
          },
        ]}
        value={[]}
        onChange={() => {}}
      />,
    );
    expect(html.match(/address/g)).toHaveLength(1);
    expect(html.includes("Descripción")).toBe(kind === "api");
  }
});
