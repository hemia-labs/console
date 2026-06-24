import { headers } from "next/headers";

import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { IdentityPageHeader } from "@/features/identity-access/components/identity-page-header";
import { listPermissions } from "@/features/identity-access/permissions/api";
import { PermissionsClient } from "@/features/identity-access/permissions/permissions-client";
import { breadcrumbsFor } from "@/lib/nav";

async function permissionsHeaders() {
  const cookie = (await headers()).get("cookie");
  return cookie ? { Cookie: cookie } : undefined;
}

export default async function PermissionsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const requestHeaders = await permissionsHeaders();
  const permissionsResult = await listPermissions({ headers: requestHeaders }).then(
    (permissions) => ({ error: null, permissions }),
    (error: Error) => ({ error: error.message, permissions: [] })
  );

  return (
    <div className="space-y-6">
      <IdentityPageHeader
        breadcrumb={<AppBreadcrumb items={breadcrumbsFor("/identity-access/permissions", lang)} />}
        description="Consulta permisos, crea permisos administrativos y sincroniza permisos base."
        title="Permisos"
      />
      <PermissionsClient
        initialError={permissionsResult.error}
        permissions={permissionsResult.permissions}
      />
    </div>
  );
}
