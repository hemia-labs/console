import { consoleApi } from "@/lib/console-api";
import type { ConsoleApiRequestOptions } from "@/lib/console-api.types";
import type {
  CreatePermissionPayload,
  IdentityPermission,
} from "@/features/identity-access/types";
import { compactPayload, readListFromPayload } from "@/features/identity-access/types";

const PERMISSIONS_PATH = "/identity-access/permissions";

export async function listPermissions(options: ConsoleApiRequestOptions = {}) {
  const payload = await consoleApi.get<unknown>(PERMISSIONS_PATH, options);
  return readListFromPayload<IdentityPermission>(payload, ["permissions"]);
}

export function getPermission(id: string) {
  return consoleApi.get<IdentityPermission>(`${PERMISSIONS_PATH}/${id}`);
}

export function createPermission(payload: CreatePermissionPayload) {
  return consoleApi.post<IdentityPermission>(PERMISSIONS_PATH, compactPayload(payload));
}

export function syncBasePermissions() {
  return consoleApi.post<unknown>(`${PERMISSIONS_PATH}/sync-base`);
}
