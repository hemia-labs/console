export const organizationStatuses = ["active", "suspended", "archived"] as const;

export type OrganizationStatus = (typeof organizationStatuses)[number];

export type AccessOrganization = {
  archivedAt?: string | null;
  code: string;
  countryCode?: string | null;
  createdAt?: string | null;
  id: string;
  legalName?: string | null;
  metadata?: Record<string, unknown> | null;
  name: string;
  slug: string;
  status?: OrganizationStatus | string | null;
  timezone?: string | null;
  type?: string | null;
  updatedAt?: string | null;
  version?: number | null;
};

export type OrganizationFilters = {
  limit?: number;
  search?: string;
  status?: string;
  type?: string;
};

export type CreateOrganizationPayload = {
  code: string;
  countryCode?: string;
  legalName?: string;
  metadata?: Record<string, unknown>;
  name: string;
  slug: string;
  status?: "active" | "suspended";
  timezone?: string;
  type?: string;
};

export type UpdateOrganizationPayload = {
  legalName?: string;
  metadata?: Record<string, unknown>;
  name?: string;
  timezone?: string;
};

export type OrganizationFormPayload =
  | CreateOrganizationPayload
  | UpdateOrganizationPayload;

export const productStatuses = ["active", "deprecated", "disabled"] as const;
export type ProductStatus = (typeof productStatuses)[number];

export const organizationProductStatuses = [
  "pending",
  "provisioning",
  "enabled",
  "suspended",
  "disabled",
  "failed",
  "expired",
] as const;
export type OrganizationProductStatus =
  (typeof organizationProductStatuses)[number];

export type ProductProvisioningMode =
  | "manual"
  | "event_driven"
  | "api_callback"
  | "none";

export type ProductAudience = "internal" | "customer" | "mixed";

export type AccessProduct = {
  audience?: ProductAudience | string | null;
  code: string;
  createdAt?: string | null;
  description?: string | null;
  id?: string;
  metadata?: Record<string, unknown> | null;
  name: string;
  provisioningMode?: ProductProvisioningMode | string | null;
  status?: ProductStatus | string | null;
  updatedAt?: string | null;
};

export type OrganizationProductSource =
  | "manual"
  | "billing"
  | "contract"
  | "migration"
  | "internal";

export type OrganizationProduct = {
  configuration?: Record<string, unknown> | null;
  createdAt?: string | null;
  disabledAt?: string | null;
  enabledAt?: string | null;
  entitlementReference?: string | null;
  expiresAt?: string | null;
  id: string;
  organizationId: string;
  product?: AccessProduct | null;
  productId?: string | null;
  source?: OrganizationProductSource | string | null;
  status?: OrganizationProductStatus | string | null;
  suspendedAt?: string | null;
  updatedAt?: string | null;
  version?: number | null;
};

export type EnableOrganizationProductPayload = {
  configuration?: Record<string, unknown>;
  entitlement_reference?: string;
  source?: OrganizationProductSource;
};
