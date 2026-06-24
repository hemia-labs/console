import { consoleApi } from "@/lib/console-api";
import type { ConsoleApiRequestOptions } from "@/lib/console-api.types";
import type {
  CreateSsoClientPayload,
  IdentitySsoClient,
  UpdateSsoClientPayload,
} from "@/features/identity-access/types";
import { compactPayload, readListFromPayload } from "@/features/identity-access/types";

const SSO_CLIENTS_PATH = "/identity-access/sso-clients";

export async function listSsoClients(options: ConsoleApiRequestOptions = {}) {
  const payload = await consoleApi.get<unknown>(SSO_CLIENTS_PATH, options);
  return readListFromPayload<IdentitySsoClient>(payload, ["ssoClients"]);
}

export function getSsoClient(id: string, options?: ConsoleApiRequestOptions) {
  return consoleApi.get<IdentitySsoClient>(`${SSO_CLIENTS_PATH}/${id}`, options);
}

export function createSsoClient(payload: CreateSsoClientPayload) {
  return consoleApi.post<IdentitySsoClient>(SSO_CLIENTS_PATH, compactPayload(payload));
}

export function updateSsoClient(id: string, payload: UpdateSsoClientPayload) {
  return consoleApi.patch<IdentitySsoClient>(`${SSO_CLIENTS_PATH}/${id}`, compactPayload(payload));
}

export function deleteSsoClient(id: string) {
  return consoleApi.delete<void>(`${SSO_CLIENTS_PATH}/${id}`);
}
