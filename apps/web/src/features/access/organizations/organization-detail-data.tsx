"use client";

import { useCallback } from "react";
import { ConsoleDataLoader } from "@/features/auth/console-data-loader";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { PageHeader } from "@/components/page-header";
import {
  getOrganization,
  listOrganizationProducts,
  listProducts,
} from "@/features/access/organizations/api";
import { OrganizationDetailClient } from "@/features/access/organizations/organization-detail-client";
import { localizedHref } from "@/lib/nav";

export function OrganizationDetailData({
  organizationId,
  locale: lang,
}: {
  organizationId: string;
  locale: string;
}) {
  const load = useCallback(
    async (signal: AbortSignal) => {
      const options = { signal };
      const [organization, products, organizationProducts] = await Promise.all([
        getOrganization(organizationId, options),
        listProducts(options),
        listOrganizationProducts(organizationId, options),
      ]);
      return { organization, products, organizationProducts };
    },
    [organizationId]
  );
  return (
    <ConsoleDataLoader load={load} title="No se pudo cargar la organización">
      {({ organization, products, organizationProducts }, refresh) => (
        <div className="space-y-6">
          <PageHeader
            breadcrumb={
              <AppBreadcrumb
                items={[
                  { href: localizedHref(lang, "/"), label: "Hemia" },
                  {
                    href: localizedHref(lang, "/access/organizations"),
                    label: "Organizations",
                  },
                  { label: organization.name },
                ]}
              />
            }
            description="Consulta los datos y acciones operativas de la organización."
            title={organization.name}
          />
          {organization ? (
            <OrganizationDetailClient
              locale={lang}
              organization={organization}
              organizationProducts={organizationProducts}
              products={products}
              onRefresh={refresh}
            />
          ) : null}
        </div>
      )}
    </ConsoleDataLoader>
  );
}
