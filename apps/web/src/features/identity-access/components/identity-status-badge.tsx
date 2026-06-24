import { StatusBadge, type StatusBadgeTone } from "@/components/status-badge";
import type { TenantStatus, UserStatus } from "@/features/identity-access/types";

const statusMeta: Record<UserStatus | TenantStatus, { label: string; tone: StatusBadgeTone }> = {
  active: { label: "Activo", tone: "success" },
  cancelled: { label: "Cancelado", tone: "danger" },
  deleted: { label: "Eliminado", tone: "danger" },
  locked: { label: "Bloqueado", tone: "warning" },
  suspended: { label: "Suspendido", tone: "muted" },
  trial: { label: "Trial", tone: "info" },
};

export function IdentityStatusBadge({ status }: { status?: string }) {
  const meta = statusMeta[status as UserStatus] ?? {
    label: status ? status : "Desconocido",
    tone: "muted" as const,
  };

  return <StatusBadge label={meta.label} tone={meta.tone} />;
}
