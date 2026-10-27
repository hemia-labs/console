import { PageHeader } from "@/components/page-header";
import { InvitationsClient } from "@/features/access/organizations/invitations-client";
export default function InvitationsPage() {
  return <div className="space-y-6"><PageHeader title="Invitaciones" description="Invita personas a una organización y administra sus enlaces de acceso." /><InvitationsClient /></div>;
}
