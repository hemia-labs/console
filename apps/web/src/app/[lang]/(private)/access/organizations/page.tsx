import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { PageHeader } from "@/components/page-header";
import { OrganizationsData } from "@/features/access/organizations/organizations-data";
import { breadcrumbsFor } from "@/lib/nav";
import type { OrganizationFilters } from "@/features/access/organizations/types";

export default async function OrganizationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{
    limit?: string;
    search?: string;
    status?: string;
    type?: string;
  }>;
}) {
  const { lang } = await params;
  const query = await searchParams;
  const parsedLimit = query.limit ? Number(query.limit) : undefined;
  const filters: OrganizationFilters = {
    limit:
      parsedLimit && Number.isFinite(parsedLimit) && parsedLimit > 0
        ? parsedLimit
        : undefined,
    search: query.search,
    status: query.status,
    type: query.type,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={
          <AppBreadcrumb
            items={breadcrumbsFor("/access/organizations", lang)}
          />
        }
        description="Administra las organizaciones que forman la base de Hemia Access."
        title="Organizations"
      />
      <OrganizationsData filters={filters} locale={lang} />
    </div>
  );
}
