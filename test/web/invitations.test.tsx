import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { InvitationsClient } from "../../apps/web/src/features/access/organizations/invitations-client";
import { NewInvitationClient } from "../../apps/web/src/features/access/organizations/new-invitation-client";
import { InvitationForm } from "../../apps/web/src/features/access/organizations/invitation-form";

describe("Invitation screens", () => {
  test("shows a global list and links to a separate creation screen", () => {
    const html = renderToStaticMarkup(<InvitationsClient />);
    expect(html).toContain('href="/es/access/invitations/new"');
    expect(html).toContain("Organizaciones disponibles");
    expect(html).toContain("Cargando invitaciones");
    expect(html).not.toContain('type="email"');
    expect(html).not.toContain("Selecciona una organización");
  });
  test("selects an organization before showing the new invitation form", () => {
    const html = renderToStaticMarkup(<NewInvitationClient locale="es" />);
    expect(html).toContain("Selecciona una organización");
    expect(html).not.toContain("Roles organizacionales");
  });
  test("keeps the email form disabled until organizational roles have loaded", () => {
    const html = renderToStaticMarkup(<InvitationForm organizationId="organization" locale="es" onPendingChange={() => {}} />);
    expect(html).toContain('type="email"');
    expect(html).toContain("Roles organizacionales");
    expect(html).toContain("Cargando roles");
    expect(html).toContain('disabled=""');
    expect(html).not.toContain("tokenHash");
  });
});
