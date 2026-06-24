import { consoleApi } from "@/lib/console-api";
import type { ConsoleApiRequestOptions } from "@/lib/console-api.types";
import {
  compactPayload,
  type CreateOAuthClientPayload,
  type IdentityOAuthClient,
  type OAuthClientListField,
  type OAuthClientListQuery,
  type OAuthClientSecretResult,
  type UpdateOAuthClientPayload,
} from "@/features/identity-access/oauth-clients/types";

const OAUTH_CLIENTS_PATH = "/identity-access/oauth-clients";
const listPathByField: Record<OAuthClientListField, string> = {
  grantTypes: "grant-types",
  redirectUris: "redirect-uris",
  responseTypes: "response-types",
  scopes: "scopes",
};

function readOAuthClientsFromPayload(payload: unknown): IdentityOAuthClient[] {
  if (Array.isArray(payload)) {
    return payload as IdentityOAuthClient[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;
  const candidates = [record.data, record.items, record.oauthClients, record.results];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as IdentityOAuthClient[];
    }
  }

  if (record.data && typeof record.data === "object") {
    return readOAuthClientsFromPayload(record.data);
  }

  return [];
}

export async function listOAuthClients(
  query: OAuthClientListQuery = {},
  options: Omit<ConsoleApiRequestOptions, "query"> = {}
) {
  const payload = await consoleApi.get<unknown>(OAUTH_CLIENTS_PATH, {
    ...options,
    query: compactPayload(query),
  });

  return readOAuthClientsFromPayload(payload);
}

export function getOAuthClient(id: string, options?: ConsoleApiRequestOptions) {
  return consoleApi.get<IdentityOAuthClient>(`${OAUTH_CLIENTS_PATH}/${id}`, options);
}

export function createOAuthClient(payload: CreateOAuthClientPayload) {
  return consoleApi.post<OAuthClientSecretResult>(OAUTH_CLIENTS_PATH, compactPayload(payload));
}

export function updateOAuthClient(id: string, payload: UpdateOAuthClientPayload) {
  return consoleApi.patch<IdentityOAuthClient>(`${OAUTH_CLIENTS_PATH}/${id}`, compactPayload(payload));
}

export function rotateOAuthClientSecret(id: string) {
  return consoleApi.post<OAuthClientSecretResult>(`${OAUTH_CLIENTS_PATH}/${id}/rotate-secret`);
}

export function addOAuthClientListValue(id: string, field: OAuthClientListField, value: string) {
  return consoleApi.post<IdentityOAuthClient>(
    `${OAUTH_CLIENTS_PATH}/${id}/${listPathByField[field]}`,
    { value }
  );
}

export function removeOAuthClientListValue(id: string, field: OAuthClientListField, value: string) {
  return consoleApi.delete<IdentityOAuthClient>(
    `${OAUTH_CLIENTS_PATH}/${id}/${listPathByField[field]}`,
    { value }
  );
}

export function deleteOAuthClient(id: string) {
  return consoleApi.delete<void>(`${OAUTH_CLIENTS_PATH}/${id}`);
}
