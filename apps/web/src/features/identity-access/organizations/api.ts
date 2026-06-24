import { consoleApi } from "@/lib/console-api";
import type { ConsoleApiRequestOptions } from "@/lib/console-api.types";
import type {
  CreateOrganizationPayload,
  IdentityOrganization,
  UpdateOrganizationPayload,
} from "@/features/identity-access/types";
import { compactPayload, readListFromPayload } from "@/features/identity-access/types";

const ORGANIZATIONS_PATH = "/identity-access/organizations";

export async function listOrganizations(options: ConsoleApiRequestOptions = {}) {
  const payload = await consoleApi.get<unknown>(ORGANIZATIONS_PATH, options);
  return readListFromPayload<IdentityOrganization>(payload, ["organizations"]);
}

export function getOrganization(id: string) {
  return consoleApi.get<IdentityOrganization>(`${ORGANIZATIONS_PATH}/${id}`);
}

export function createOrganization(payload: CreateOrganizationPayload) {
  return consoleApi.post<IdentityOrganization>(ORGANIZATIONS_PATH, compactPayload(payload));
}

export function updateOrganization(id: string, payload: UpdateOrganizationPayload) {
  return consoleApi.patch<IdentityOrganization>(`${ORGANIZATIONS_PATH}/${id}`, compactPayload(payload));
}

export function deleteOrganization(id: string) {
  return consoleApi.delete<void>(`${ORGANIZATIONS_PATH}/${id}`);
}
