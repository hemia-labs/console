import { headers } from "next/headers";

import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { IdentityPageHeader } from "@/features/identity-access/components/identity-page-header";
import type { MembershipListQuery } from "@/features/identity-access/types";
import { listMemberships } from "@/features/identity-access/memberships/api";
import { MembershipsClient } from "@/features/identity-access/memberships/memberships-client";
import { breadcrumbsFor } from "@/lib/nav";

async function membershipsHeaders() {
  const cookie = (await headers()).get("cookie");
  return cookie ? { Cookie: cookie } : undefined;
}

export default async function MembershipsPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<MembershipListQuery>;
}) {
  const { lang } = await params;
  const query = await searchParams;
  const requestHeaders = await membershipsHeaders();
  const membershipsResult = await listMemberships(query, { headers: requestHeaders }).then(
    (memberships) => ({ error: null, memberships }),
    (error: Error) => ({ error: error.message, memberships: [] })
  );

  return (
    <div className="space-y-6">
      <IdentityPageHeader
        breadcrumb={<AppBreadcrumb items={breadcrumbsFor("/identity-access/memberships", lang)} />}
        description="Administra membresias entre usuarios, organizaciones, teams y roles."
        title="Membresias"
      />
      <MembershipsClient
        initialError={membershipsResult.error}
        memberships={membershipsResult.memberships}
      />
    </div>
  );
}
