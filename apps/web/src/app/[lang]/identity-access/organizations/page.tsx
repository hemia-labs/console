import { headers } from "next/headers";

import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { IdentityPageHeader } from "@/features/identity-access/components/identity-page-header";
import { listOrganizations } from "@/features/identity-access/organizations/api";
import { OrganizationsClient } from "@/features/identity-access/organizations/organizations-client";
import { breadcrumbsFor } from "@/lib/nav";

async function organizationsHeaders() {
  const cookie = (await headers()).get("cookie");
  return cookie ? { Cookie: cookie } : undefined;
}

export default async function OrganizationsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const requestHeaders = await organizationsHeaders();
  const organizationsResult = await listOrganizations({ headers: requestHeaders }).then(
    (organizations) => ({ error: null, organizations }),
    (error: Error) => ({ error: error.message, organizations: [] })
  );

  return (
    <div className="space-y-6">
      <IdentityPageHeader
        breadcrumb={<AppBreadcrumb items={breadcrumbsFor("/identity-access/organizations", lang)} />}
        description="Administra organizaciones vinculadas a la cuenta activa."
        title="Organizaciones"
      />
      <OrganizationsClient
        initialError={organizationsResult.error}
        organizations={organizationsResult.organizations}
      />
    </div>
  );
}
