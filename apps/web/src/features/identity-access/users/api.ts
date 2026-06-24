import { consoleApi } from "@/lib/console-api";
import type { ConsoleApiRequestOptions } from "@/lib/console-api.types";
import type {
  CreateUserPayload,
  IdentityUser,
  UpdateUserPayload,
  UserListQuery,
  UserStatus,
} from "@/features/identity-access/types";
import { compactPayload } from "@/features/identity-access/types";

const USERS_PATH = "/identity-access/users";

function readUsersFromPayload(payload: unknown): IdentityUser[] {
  if (Array.isArray(payload)) {
    return payload as IdentityUser[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;
  const candidates = [record.data, record.items, record.users, record.results];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as IdentityUser[];
    }
  }

  if (record.data && typeof record.data === "object") {
    return readUsersFromPayload(record.data);
  }

  return [];
}

export async function listUsers(
  query: UserListQuery = {},
  options: Omit<ConsoleApiRequestOptions, "query"> = {}
) {
  const payload = await consoleApi.get<unknown>(USERS_PATH, {
    ...options,
    query: compactPayload(query),
  });

  return readUsersFromPayload(payload);
}

export function getUser(id: string) {
  return consoleApi.get<IdentityUser>(`${USERS_PATH}/${id}`);
}

export function createUser(payload: CreateUserPayload) {
  return consoleApi.post<IdentityUser>(USERS_PATH, compactPayload(payload));
}

export function updateUser(id: string, payload: UpdateUserPayload) {
  return consoleApi.patch<IdentityUser>(`${USERS_PATH}/${id}`, compactPayload(payload));
}

export function updateUserStatus(id: string, status: UserStatus) {
  return consoleApi.patch<IdentityUser>(`${USERS_PATH}/${id}/status`, { status });
}

export function lockUser(id: string) {
  return consoleApi.patch<IdentityUser>(`${USERS_PATH}/${id}/lock`);
}

export function unlockUser(id: string) {
  return consoleApi.patch<IdentityUser>(`${USERS_PATH}/${id}/unlock`);
}

export function deleteUser(id: string) {
  return consoleApi.delete<void>(`${USERS_PATH}/${id}`);
}
