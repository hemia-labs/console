import { consoleApi } from "@/lib/console-api";
import type { ConsoleApiRequestOptions } from "@/lib/console-api.types";
import type {
  CreateTenantPayload,
  IdentityTenant,
  TenantStatus,
  UpdateTenantPayload,
} from "@/features/identity-access/types";
import { compactPayload, readListFromPayload } from "@/features/identity-access/types";

const TENANTS_PATH = "/identity-access/tenants";

export async function listTenants(options: ConsoleApiRequestOptions = {}) {
  const payload = await consoleApi.get<unknown>(TENANTS_PATH, options);
  return readListFromPayload<IdentityTenant>(payload, ["tenants"]);
}

export function getTenant(id: string) {
  return consoleApi.get<IdentityTenant>(`${TENANTS_PATH}/${id}`);
}

export function createTenant(payload: CreateTenantPayload) {
  return consoleApi.post<IdentityTenant>(TENANTS_PATH, compactPayload(payload));
}

export function updateTenant(id: string, payload: UpdateTenantPayload) {
  return consoleApi.patch<IdentityTenant>(`${TENANTS_PATH}/${id}`, compactPayload(payload));
}

export function updateTenantStatus(id: string, status: TenantStatus) {
  return consoleApi.patch<IdentityTenant>(`${TENANTS_PATH}/${id}/status`, { status });
}

export function deleteTenant(id: string) {
  return consoleApi.delete<void>(`${TENANTS_PATH}/${id}`);
}
