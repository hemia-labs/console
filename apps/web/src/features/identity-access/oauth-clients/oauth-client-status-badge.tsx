import { StatusBadge, type StatusBadgeTone } from "@/components/status-badge";
import type { OAuthClientStatus } from "./types";

const statusMeta: Record<OAuthClientStatus, { label: string; tone: StatusBadgeTone }> = {
  active: { label: "Activo", tone: "success" },
  deleted: { label: "Eliminado", tone: "danger" },
  suspended: { label: "Suspendido", tone: "muted" },
};

export function OAuthClientStatusBadge({ status }: { status?: string }) {
  const meta = statusMeta[status as OAuthClientStatus] ?? {
    label: status ? status : "Desconocido",
    tone: "muted" as const,
  };

  return <StatusBadge label={meta.label} tone={meta.tone} />;
}
