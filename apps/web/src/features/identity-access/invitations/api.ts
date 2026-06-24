import { consoleApi } from "@/lib/console-api";
import type { CreateInvitationPayload } from "@/features/identity-access/types";
import { compactPayload } from "@/features/identity-access/types";

const INVITATIONS_PATH = "/identity-access/invitations";

export function createInvitation(payload: CreateInvitationPayload) {
  return consoleApi.post<unknown>(INVITATIONS_PATH, compactPayload(payload));
}

export function resendInvitation(id: string) {
  return consoleApi.post<unknown>(`${INVITATIONS_PATH}/${id}/resend`);
}

export function cancelInvitation(id: string) {
  return consoleApi.post<unknown>(`${INVITATIONS_PATH}/${id}/cancel`);
}
