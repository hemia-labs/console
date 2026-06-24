import { consoleApi } from "@/lib/console-api";
import type { ConsoleApiRequestOptions } from "@/lib/console-api.types";
import type {
  CreateRolePayload,
  IdentityRole,
  UpdateRolePayload,
} from "@/features/identity-access/types";
import { compactPayload, readListFromPayload } from "@/features/identity-access/types";

const ROLES_PATH = "/identity-access/roles";

export async function listRoles(options: ConsoleApiRequestOptions = {}) {
  const payload = await consoleApi.get<unknown>(ROLES_PATH, options);
  return readListFromPayload<IdentityRole>(payload, ["roles"]);
}

export function getRole(id: string) {
  return consoleApi.get<IdentityRole>(`${ROLES_PATH}/${id}`);
}

export function createRole(payload: CreateRolePayload) {
  return consoleApi.post<IdentityRole>(ROLES_PATH, compactPayload(payload));
}

export function updateRole(id: string, payload: UpdateRolePayload) {
  return consoleApi.patch<IdentityRole>(`${ROLES_PATH}/${id}`, compactPayload(payload));
}

export function deleteRole(id: string) {
  return consoleApi.delete<void>(`${ROLES_PATH}/${id}`);
}

export function assignPermissionToRole(roleId: string, permissionId: string) {
  return consoleApi.post<unknown>(`${ROLES_PATH}/${roleId}/permissions`, { permissionId });
}

export function removePermissionFromRole(roleId: string, permissionId: string) {
  return consoleApi.delete<void>(`${ROLES_PATH}/${roleId}/permissions/${permissionId}`);
}

export function assignRoleToUser(userId: string, roleId: string) {
  return consoleApi.post<unknown>(`${ROLES_PATH}/users/${userId}`, { roleId });
}

export function removeRoleFromUser(userId: string, roleId: string) {
  return consoleApi.delete<void>(`${ROLES_PATH}/users/${userId}/${roleId}`);
}
