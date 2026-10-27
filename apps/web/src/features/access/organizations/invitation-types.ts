export type Invitation = {
  id: string;
  organizationId: string;
  organizationName?: string | null;
  emailNormalized: string;
  roleCodes?: string[];
  status: string;
  createdAt?: string;
  expiresAt: string;
  delivery?: "sent" | "failed";
};
export type InvitationPage = { items: Invitation[]; total: number; limit: number; offset: number };
export const invitationStatuses: Record<string, string> = { pending: "Pendiente", accepted: "Aceptada", expired: "Vencida", revoked: "Revocada" };
