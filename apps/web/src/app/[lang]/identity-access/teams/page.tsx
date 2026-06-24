import { headers } from "next/headers";

import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { IdentityPageHeader } from "@/features/identity-access/components/identity-page-header";
import { listTeams } from "@/features/identity-access/teams/api";
import { TeamsClient } from "@/features/identity-access/teams/teams-client";
import { breadcrumbsFor } from "@/lib/nav";

async function teamsHeaders() {
  const cookie = (await headers()).get("cookie");
  return cookie ? { Cookie: cookie } : undefined;
}

export default async function TeamsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const requestHeaders = await teamsHeaders();
  const teamsResult = await listTeams({ headers: requestHeaders }).then(
    (teams) => ({ error: null, teams }),
    (error: Error) => ({ error: error.message, teams: [] })
  );

  return (
    <div className="space-y-6">
      <IdentityPageHeader
        breadcrumb={<AppBreadcrumb items={breadcrumbsFor("/identity-access/teams", lang)} />}
        description="Administra teams y su relacion con organizaciones."
        title="Teams"
      />
      <TeamsClient initialError={teamsResult.error} teams={teamsResult.teams} />
    </div>
  );
}
