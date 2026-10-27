import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { InvitationsClient } from "../../apps/web/src/features/access/organizations/invitations-client";
import { OrganizationInvitationsSection } from "../../apps/web/src/features/access/organizations/organization-invitations-section";

describe("Invitation screens", () => {
  test("requires selecting an organization before creating invitations", () => {
    const html = renderToStaticMarkup(<InvitationsClient />);
    expect(html).toContain("Selecciona una organización");
    expect(html).not.toContain("Roles organizacionales");
  });
  test("renders a labeled email form and disables invite while loading authorization data", () => {
    const html = renderToStaticMarkup(<OrganizationInvitationsSection organizationId="organization" />);
    expect(html).toContain('type="email"');
    expect(html).toContain("Roles organizacionales");
    expect(html).toContain("Cargando invitaciones");
    expect(html).toContain('disabled=""');
    expect(html).not.toContain("tokenHash");
  });
});
