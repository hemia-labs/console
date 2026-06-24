import { headers } from "next/headers";

import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { IdentityPageHeader } from "@/features/identity-access/components/identity-page-header";
import { listTenants } from "@/features/identity-access/tenants/api";
import { TenantsClient } from "@/features/identity-access/tenants/tenants-client";
import { breadcrumbsFor } from "@/lib/nav";

async function tenantsHeaders() {
  const cookie = (await headers()).get("cookie");
  return cookie ? { Cookie: cookie } : undefined;
}

export default async function TenantsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const requestHeaders = await tenantsHeaders();
  const tenantsResult = await listTenants({ headers: requestHeaders }).then(
    (tenants) => ({ error: null, tenants }),
    (error: Error) => ({ error: error.message, tenants: [] })
  );

  return (
    <div className="space-y-6">
      <IdentityPageHeader
        breadcrumb={<AppBreadcrumb items={breadcrumbsFor("/identity-access/tenants", lang)} />}
        description="Administra tenants, planes y estados desde Console API."
        title="Tenants"
      />
      <TenantsClient initialError={tenantsResult.error} tenants={tenantsResult.tenants} />
    </div>
  );
}
