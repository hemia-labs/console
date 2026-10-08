import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { OneTimeSecretPanel } from "../src/features/identity-access/oauth-clients/one-time-secret-panel";

const secret = { title: "Cliente OAuth creado", clientId: "demo", audience: "demo-api", clientSecret: "demo-secret-for-test" };

test("shows the one-time secret with copy feedback and a link to finish", () => {
  const html = renderToStaticMarkup(<OneTimeSecretPanel secret={secret} returnHref="/es/identity/oauth-clients" />);
  expect(html).toContain(secret.clientSecret);
  expect(html).toContain("Este secreto se muestra una sola vez");
  expect(html).toContain("Copiar secreto");
  expect(html).toContain('role="status"');
  expect(html).toContain('href="/es/identity/oauth-clients"');
  expect(html).not.toContain("Cerrar secreto");
});

test("keeps rotated secrets dismissible without a finish link", () => {
  const html = renderToStaticMarkup(<OneTimeSecretPanel secret={{ ...secret, title: "Secreto rotado" }} onDismiss={() => {}} />);
  expect(html).toContain("Secreto rotado");
  expect(html).toContain('aria-label="Cerrar secreto"');
  expect(html).not.toContain("Finalizar");
});
