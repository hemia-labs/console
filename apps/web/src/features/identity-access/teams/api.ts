import { consoleApi } from "@/lib/console-api";
import type { ConsoleApiRequestOptions } from "@/lib/console-api.types";
import type {
  CreateTeamPayload,
  IdentityTeam,
  UpdateTeamPayload,
} from "@/features/identity-access/types";
import { compactPayload, readListFromPayload } from "@/features/identity-access/types";

const TEAMS_PATH = "/identity-access/teams";

export async function listTeams(options: ConsoleApiRequestOptions = {}) {
  const payload = await consoleApi.get<unknown>(TEAMS_PATH, options);
  return readListFromPayload<IdentityTeam>(payload, ["teams"]);
}

export function getTeam(id: string) {
  return consoleApi.get<IdentityTeam>(`${TEAMS_PATH}/${id}`);
}

export function createTeam(payload: CreateTeamPayload) {
  return consoleApi.post<IdentityTeam>(TEAMS_PATH, compactPayload(payload));
}

export function updateTeam(id: string, payload: UpdateTeamPayload) {
  return consoleApi.patch<IdentityTeam>(`${TEAMS_PATH}/${id}`, compactPayload(payload));
}

export function deleteTeam(id: string) {
  return consoleApi.delete<void>(`${TEAMS_PATH}/${id}`);
}
