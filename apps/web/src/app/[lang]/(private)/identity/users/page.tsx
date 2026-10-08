import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { IdentityPageHeader } from "@/features/identity-access/components/identity-page-header";
import type { UserListQuery } from "@/features/identity-access/types";
import { UsersData } from "@/features/identity-access/users/users-data";
import { breadcrumbsFor } from "@/lib/nav";

export default async function UsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<UserListQuery>;
}) {
  const { lang } = await params;
  const query = await searchParams;

  return (
    <div className="space-y-6">
      <IdentityPageHeader
        breadcrumb={
          <AppBreadcrumb items={breadcrumbsFor("/identity/users", lang)} />
        }
        description="Administra altas, estado y bloqueo de usuarios desde Console API."
        title="Usuarios"
      />
      <UsersData query={query} />
    </div>
  );
}
