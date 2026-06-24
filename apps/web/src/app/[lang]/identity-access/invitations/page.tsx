import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { IdentityPageHeader } from "@/features/identity-access/components/identity-page-header";
import { InvitationsClient } from "@/features/identity-access/invitations/invitations-client";
import { breadcrumbsFor } from "@/lib/nav";

export default async function InvitationsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;

  return (
    <div className="space-y-6">
      <IdentityPageHeader
        breadcrumb={<AppBreadcrumb items={breadcrumbsFor("/identity-access/invitations", lang)} />}
        description="Crea invitaciones y administra reenvios o cancelaciones por ID."
        title="Invitaciones"
      />
      <InvitationsClient />
    </div>
  );
}
