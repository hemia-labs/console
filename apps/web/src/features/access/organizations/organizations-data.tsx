"use client";

import { useCallback } from "react";
import { ConsoleDataLoader } from "@/features/auth/console-data-loader";
import { listOrganizations } from "./api";
import { OrganizationsClient } from "./organizations-client";
import type { OrganizationFilters } from "./types";

export function OrganizationsData({
  filters,
  locale,
}: {
  filters: OrganizationFilters;
  locale: string;
}) {
  const load = useCallback(
    (signal: AbortSignal) => listOrganizations(filters, { signal }),
    [filters]
  );
  return (
    <ConsoleDataLoader
      load={load}
      title="No se pudieron cargar las organizaciones"
    >
      {(organizations, refresh) => (
        <OrganizationsClient
          organizations={organizations}
          initialFilters={filters}
          locale={locale}
          onRefresh={refresh}
        />
      )}
    </ConsoleDataLoader>
  );
}
