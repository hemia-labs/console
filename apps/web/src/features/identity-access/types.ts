export const userStatuses = ["active", "suspended", "locked", "deleted"] as const;
export const tenantStatuses = ["trial", "active", "suspended", "cancelled", "deleted"] as const;
export const ssoClientStatuses = ["active", "suspended", "deleted"] as const;

export type UserStatus = (typeof userStatuses)[number];
export type TenantStatus = (typeof tenantStatuses)[number];
export type SsoClientStatus = (typeof ssoClientStatuses)[number];

export type IdentityUser = {
  avatarUrl: null | string;
  createdAt: string;
  deletedAt: null | string;
  displayName?: string;
  email: string;
  firstName?: string;
  id: string;
  lastName?: string;
  lastLoginAt: null | string;
  lockedAt: null | string;
  name?: string;
  status: UserStatus;
  sub?: string;
  updatedAt: string;
  username?: string;
  [key: string]: unknown;
};

export type UserListQuery = {
  email?: string;
  limit?: string;
  page?: string;
  search?: string;
  status?: UserStatus | "";
};

export type CreateUserPayload = {
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  password?: string;
  status?: UserStatus;
};

export type UpdateUserPayload = Partial<CreateUserPayload>;

export type IdentityTenant = {
  createdAt?: string;
  deletedAt?: null | string;
  id: string;
  name: string;
  ownerUserId?: string;
  plan?: string;
  slug?: string;
  status?: TenantStatus | string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type CreateTenantPayload = {
  name: string;
  slug: string;
  status?: TenantStatus;
  plan?: string;
  ownerUserId?: string;
};

export type UpdateTenantPayload = Partial<CreateTenantPayload>;

export type IdentityRole = {
  createdAt?: string;
  description?: string;
  id: string;
  isSystem?: boolean;
  key?: string;
  name: string;
  permissions?: IdentityPermission[];
  scope?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type CreateRolePayload = {
  name: string;
  description?: string;
  key?: string;
  scope?: string;
  isSystem?: boolean;
};

export type UpdateRolePayload = Partial<CreateRolePayload>;

export type IdentityPermission = {
  action?: string;
  createdAt?: string;
  description?: string;
  id: string;
  key: string;
  resource?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type CreatePermissionPayload = {
  key: string;
  description?: string;
  resource?: string;
  action?: string;
};

export type CreateInvitationPayload = {
  email: string;
  organizationId?: string;
  teamId?: string;
  roleId?: string;
  expiresAt?: string;
  redirectUrl?: string;
  message?: string;
};

export type IdentityOrganization = {
  createdAt?: string;
  description?: string;
  id: string;
  name: string;
  slug?: string;
  status?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type CreateOrganizationPayload = {
  name: string;
  slug?: string;
  description?: string;
  status?: string;
};

export type UpdateOrganizationPayload = Partial<CreateOrganizationPayload>;

export type IdentityTeam = {
  createdAt?: string;
  description?: string;
  id: string;
  name: string;
  organizationId?: string;
  slug?: string;
  status?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type CreateTeamPayload = {
  name: string;
  organizationId?: string;
  slug?: string;
  description?: string;
  status?: string;
};

export type UpdateTeamPayload = Partial<CreateTeamPayload>;

export type IdentityMembership = {
  createdAt?: string;
  id: string;
  organizationId?: string;
  roleId?: string;
  status?: string;
  teamId?: string;
  updatedAt?: string;
  userId?: string;
  [key: string]: unknown;
};

export type MembershipListQuery = {
  userId?: string;
};

export type CreateMembershipPayload = {
  userId: string;
  organizationId?: string;
  teamId?: string;
  roleId?: string;
  status?: string;
};

export type IdentityAccount = {
  accountIndex?: number;
  email?: string;
  id?: string;
  name?: string;
  organizationName?: string;
  status?: string;
  tenantName?: string;
  [key: string]: unknown;
};

export type IdentitySsoClient = {
  allowedOrigins?: string[];
  allowedRedirectUris?: string[];
  clientId: string;
  createdAt?: string | null;
  deletedAt?: string | null;
  id: string;
  name: string;
  status?: SsoClientStatus;
  updatedAt?: string | null;
  [key: string]: unknown;
};

export type CreateSsoClientPayload = {
  allowedOrigins?: string[];
  allowedRedirectUris: string[];
  clientId: string;
  name: string;
  status?: SsoClientStatus;
};

export type UpdateSsoClientPayload = Partial<CreateSsoClientPayload>;

export function compactPayload<T extends Record<string, unknown>>(payload: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== "" && value !== undefined)
  ) as Partial<T>;
}

export function readListFromPayload<T>(payload: unknown, keys: string[]): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;
  const candidates = [record.data, record.items, record.results, ...keys.map((key) => record[key])];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as T[];
    }
  }

  if (record.data && typeof record.data === "object") {
    return readListFromPayload<T>(record.data, keys);
  }

  return [];
}
