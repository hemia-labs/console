export type SystemRoleCatalog = {
  productCode: string;
  name: string;
  version: number;
  contractVersion: number;
  publicationStatus: "pending" | "published" | "conflict" | "unavailable";
  roles: {
    code: string;
    name: string;
    allowedScopes: { resource: string; consumer: string }[];
  }[];
};

export function readCatalogs(value: unknown): SystemRoleCatalog[] {
  if (!Array.isArray(value)) throw new Error("Invalid catalog response");
  const keys = new Set<string>();
  const catalogs: SystemRoleCatalog[] = [];
  for (const item of value as unknown[]) {
    if (!item || typeof item !== "object")
      throw new Error("Invalid catalog response");
    const row = item as Record<string, unknown>;
    if (
      typeof row.productCode !== "string" ||
      !/^[a-z][a-z0-9_]*$/.test(row.productCode) ||
      typeof row.name !== "string" ||
      !row.name ||
      typeof row.version !== "number" ||
      !Number.isSafeInteger(row.version) ||
      row.version < 1 ||
      typeof row.contractVersion !== "number" ||
      !Number.isSafeInteger(row.contractVersion) ||
      !["pending", "published", "conflict", "unavailable"].includes(
        String(row.publicationStatus),
      ) ||
      !Array.isArray(row.roles) ||
      row.roles.length === 0
    )
      throw new Error("Invalid catalog response");
    const roles: SystemRoleCatalog["roles"] = [];
    for (const item of row.roles as unknown[]) {
      if (!item || typeof item !== "object")
        throw new Error("Invalid role response");
      const role = item as Record<string, unknown>;
      if (
        typeof role.code !== "string" ||
        !role.code ||
        typeof role.name !== "string" ||
        !Array.isArray(role.allowedScopes) ||
        !role.allowedScopes.length
      )
        throw new Error("Invalid role response");
      const allowedScopes: { resource: string; consumer: string }[] = [];
      for (const scopeItem of role.allowedScopes as unknown[]) {
        if (!scopeItem || typeof scopeItem !== "object")
          throw new Error("Invalid scope response");
        const scope = scopeItem as Record<string, unknown>;
        if (
          typeof scope.resource !== "string" ||
          !scope.resource ||
          typeof scope.consumer !== "string" ||
          !scope.consumer
        )
          throw new Error("Invalid scope response");
        allowedScopes.push({
          resource: scope.resource,
          consumer: scope.consumer,
        });
      }
      roles.push({ code: role.code, name: role.name, allowedScopes });
    }
    const key = `${row.productCode}:${row.version}`;
    if (
      keys.has(key) ||
      new Set(roles.map((role) => role.code)).size !== roles.length
    )
      throw new Error("Duplicate catalog response");
    keys.add(key);
    catalogs.push({
      productCode: row.productCode,
      name: row.name,
      version: row.version,
      contractVersion: row.contractVersion,
      publicationStatus:
        row.publicationStatus as SystemRoleCatalog["publicationStatus"],
      roles,
    });
  }
  return catalogs;
}

export function latestCatalogs(
  catalogs: SystemRoleCatalog[],
): SystemRoleCatalog[] {
  const latest = new Map<string, SystemRoleCatalog>();
  for (const catalog of catalogs) {
    const current = latest.get(catalog.productCode);
    if (!current || current.version < catalog.version)
      latest.set(catalog.productCode, catalog);
  }
  return [...latest.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function isCatalogPublication(
  value: unknown,
  catalog: SystemRoleCatalog,
): value is {
  catalogVersion: number;
  replayed: boolean;
  roles: { id: string; code: string }[];
} {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  if (
    data.catalogVersion !== catalog.version ||
    typeof data.replayed !== "boolean" ||
    !Array.isArray(data.roles) ||
    data.roles.length !== catalog.roles.length
  )
    return false;
  const codes = new Set<string>();
  const ids = new Set<string>();
  for (const role of data.roles) {
    if (
      !role ||
      typeof role !== "object" ||
      typeof role.id !== "string" ||
      !role.id ||
      typeof role.code !== "string" ||
      !catalog.roles.some((expected) => expected.code === role.code)
    )
      return false;
    codes.add(role.code);
    ids.add(role.id);
  }
  return (
    codes.size === catalog.roles.length && ids.size === catalog.roles.length
  );
}
