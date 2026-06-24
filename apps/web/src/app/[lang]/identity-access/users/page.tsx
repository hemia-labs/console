import { headers } from "next/headers";

import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { IdentityPageHeader } from "@/features/identity-access/components/identity-page-header";
import type { UserListQuery } from "@/features/identity-access/types";
import { listUsers } from "@/features/identity-access/users/api";
import { UsersClient } from "@/features/identity-access/users/users-client";
import { breadcrumbsFor } from "@/lib/nav";

async function usersHeaders() {
  const cookie = (await headers()).get("cookie");
  return cookie ? { Cookie: cookie } : undefined;
}

export default async function UsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<UserListQuery>;
}) {
  const { lang } = await params;
  const query = await searchParams;
  const requestHeaders = await usersHeaders();
  const usersResult = await listUsers(query, { headers: requestHeaders }).then(
    (users) => ({ error: null, users }),
    (error: Error) => ({ error: error.message, users: [] })
  );

  return (
    <div className="space-y-6">
      <IdentityPageHeader
        breadcrumb={<AppBreadcrumb items={breadcrumbsFor("/identity-access/users", lang)} />}
        description="Administra altas, estado y bloqueo de usuarios desde Console API."
        title="Usuarios"
      />
      <UsersClient initialError={usersResult.error} users={usersResult.users} />
    </div>
  );
}
