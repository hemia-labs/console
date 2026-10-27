import { InvitationsClient } from "./invitations-client";

export function OrganizationInvitationsSection({ organizationId }: { organizationId: string }) {
  return <InvitationsClient key={organizationId} organizationId={organizationId} />;
}
