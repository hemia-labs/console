import { headers } from "next/headers";

import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { IdentityPageHeader } from "@/features/identity-access/components/identity-page-header";
import { listRoles } from "@/features/identity-access/roles/api";
import { RolesClient } from "@/features/identity-access/roles/roles-client";
import { breadcrumbsFor } from "@/lib/nav";

async function rolesHeaders() {
  const cookie = (await headers()).get("cookie");
  return cookie ? { Cookie: cookie } : undefined;
}

export default async function RolesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const requestHeaders = await rolesHeaders();
  const rolesResult = await listRoles({ headers: requestHeaders }).then(
    (roles) => ({ error: null, roles }),
    (error: Error) => ({ error: error.message, roles: [] })
  );

  return (
    <div className="space-y-6">
      <IdentityPageHeader
        breadcrumb={<AppBreadcrumb items={breadcrumbsFor("/identity-access/roles", lang)} />}
        description="Administra roles y asignaciones por ID desde Console API."
        title="Roles"
      />
      <RolesClient initialError={rolesResult.error} roles={rolesResult.roles} />
    </div>
  );
}
