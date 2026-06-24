export const oauthClientStatuses = ["active", "suspended", "deleted"] as const;
export const oauthClientTypes = ["public", "confidential"] as const;

export type OAuthClientStatus = (typeof oauthClientStatuses)[number];
export type OAuthClientType = (typeof oauthClientTypes)[number];

export type IdentityOAuthClient = {
  audience: string;
  clientId: string;
  createdAt?: string | null;
  deletedAt?: string | null;
  grantTypes?: string[];
  id: string;
  redirectUris?: string[];
  requiresConsent?: boolean;
  responseTypes?: string[];
  scopes?: string[];
  status?: OAuthClientStatus;
  type: OAuthClientType;
  updatedAt?: string | null;
  [key: string]: unknown;
};

export type OAuthClientListQuery = {
  search?: string;
  status?: OAuthClientStatus | "";
};

export type OAuthClientListField = "redirectUris" | "scopes" | "grantTypes" | "responseTypes";

export type CreateOAuthClientPayload = {
  audience: string;
  clientId: string;
  grantTypes?: string[];
  redirectUris?: string[];
  requiresConsent?: boolean;
  responseTypes?: string[];
  scopes?: string[];
  status?: OAuthClientStatus;
  type: OAuthClientType;
};

export type UpdateOAuthClientPayload = Partial<CreateOAuthClientPayload>;

export type OAuthClientSecretResult = IdentityOAuthClient & {
  clientSecret?: string;
};

export type OneTimeOAuthSecret = {
  audience?: string;
  clientId?: string;
  clientSecret: string;
  status?: OAuthClientStatus;
  title: string;
  type?: OAuthClientType;
};

export function compactPayload<T extends Record<string, unknown>>(payload: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== "" && value !== undefined)
  ) as Partial<T>;
}
