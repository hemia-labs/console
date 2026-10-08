import { CheckCircle2, Circle, Clock, XCircle } from "lucide-react";
import { StatusBadge as ZunoStatusBadge } from "@/components/zuno/status-badge";

const statusTone = { danger: "error", info: "info", muted: "neutral", success: "success", warning: "warning" } as const;
const statusIcon = { danger: XCircle, info: Circle, muted: Circle, success: CheckCircle2, warning: Clock } as const;
export type StatusBadgeTone = keyof typeof statusTone;

export function StatusBadge({ className, label, tone = "muted" }: {
  className?: string;
  label: string;
  tone?: StatusBadgeTone;
}) {
  const Icon = statusIcon[tone];
  return <ZunoStatusBadge className={className} indicator={false} status={statusTone[tone]}><Icon className="size-3" />{label}</ZunoStatusBadge>;
}
