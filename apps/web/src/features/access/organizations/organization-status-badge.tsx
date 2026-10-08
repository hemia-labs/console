import { StatusBadge, type StatusBadgeTone } from "@/components/status-badge";

const statusMeta: Record<string, { label: string; tone: StatusBadgeTone }> = {
  active: { label: "Activa", tone: "success" },
  archived: { label: "Archivada", tone: "danger" },
  suspended: { label: "Suspendida", tone: "warning" },
};

export function OrganizationStatusBadge({ status }: { status?: string | null }) {
  const meta = statusMeta[status ?? ""] ?? {
    label: status || "Desconocida",
    tone: "muted" as const,
  };

  return <StatusBadge label={meta.label} tone={meta.tone} />;
}
