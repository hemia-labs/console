import { consoleApi } from "@/lib/console-api";
import type { ConsoleApiRequestOptions } from "@/lib/console-api.types";
import type {
  CreateMembershipPayload,
  IdentityMembership,
  MembershipListQuery,
} from "@/features/identity-access/types";
import { compactPayload, readListFromPayload } from "@/features/identity-access/types";

const MEMBERSHIPS_PATH = "/identity-access/memberships";

export async function listMemberships(
  query: MembershipListQuery = {},
  options: Omit<ConsoleApiRequestOptions, "query"> = {}
) {
  const payload = await consoleApi.get<unknown>(MEMBERSHIPS_PATH, {
    ...options,
    query: compactPayload(query),
  });
  return readListFromPayload<IdentityMembership>(payload, ["memberships"]);
}

export function createMembership(payload: CreateMembershipPayload) {
  return consoleApi.post<IdentityMembership>(MEMBERSHIPS_PATH, compactPayload(payload));
}

export function updateMembershipStatus(id: string, status: string) {
  return consoleApi.patch<IdentityMembership>(`${MEMBERSHIPS_PATH}/${id}/status`, { status });
}

export function deleteMembership(id: string) {
  return consoleApi.delete<void>(`${MEMBERSHIPS_PATH}/${id}`);
}
