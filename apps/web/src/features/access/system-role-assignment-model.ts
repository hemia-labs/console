import type { SystemRoleCatalog } from "./system-role-catalogs/catalogs";

export const assignmentPath = "/access/system-role-assignments";

export const resourceNames: Record<string, string> = {
  catalog_global: "Catálogo global",
  all_customers: "Todos los clientes",
  organizations: "Organizaciones específicas",
  legal_global: "Todo Legal",
  issuers: "Emisores específicos",
  applications: "Aplicaciones específicas",
};

export const consumerNames: Record<string, string> = {
  all_organizations: "Todas las organizaciones consumidoras",
  organizations: "Organizaciones consumidoras específicas",
};

export type RoleScope =
  SystemRoleCatalog["roles"][number]["allowedScopes"][number];
export type Assignment = {
  id: string;
  version: number;
  productCode: string;
  roleId: string;
  roleCode: string;
  roleName: string;
  catalogVersion: number;
  scopeType: string;
  consumerScopeType: string;
  validFrom: string;
  expiresAt: string | null;
  status: "active" | "scheduled" | "inactive_delegation";
  targets: { id: string; type: string; name: string | null }[];
};

export function scopeName({ resource, consumer }: RoleScope) {
  return [resourceNames[resource] ?? resource, consumerNames[consumer]]
    .filter(Boolean)
    .join(" · ");
}

export function buildAssignmentPayload(
  selection: {
    membershipId: string;
    roleId: string;
    scope: RoleScope;
    organizationIds: string[];
    resourceIds: string[];
  },
  request: {
    idempotencyKey: string;
    validFrom: string;
    expiresAt: string | null;
  },
) {
  const { scope, membershipId, roleId, organizationIds, resourceIds } =
    selection;
  const legal = ["legal_global", "issuers", "applications"].includes(
    scope.resource,
  );
  return {
    membershipId,
    roleId,
    scopeType: scope.resource,
    organizationIds:
      scope.resource === "organizations" || scope.consumer === "organizations"
        ? organizationIds
        : [],
    ...(legal
      ? {
          consumerScopeType: scope.consumer,
          resourceIds: scope.resource === "legal_global" ? [] : resourceIds,
        }
      : {}),
    ...request,
  };
}

export function parseTargetIds(
  selected: string[],
  additional: string,
): string[] {
  const ids = [
    ...new Set([
      ...selected,
      ...additional
        .trim()
        .toLowerCase()
        .split(/[\s,]+/)
        .filter(Boolean),
    ]),
  ];
  if (
    ids.some((id) => !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id))
  ) {
    throw new Error(
      "Revisa los IDs. Usa el formato UUID y separa cada ID con una coma o un salto de línea.",
    );
  }
  return ids;
}
