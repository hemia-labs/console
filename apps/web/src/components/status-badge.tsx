import { CheckCircle2, Circle, Clock, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusTone = {
  danger: "bg-red-50 text-red-700",
  info: "bg-secondary text-primary",
  muted: "bg-muted text-muted-foreground",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
} as const;

const statusIcon = {
  danger: XCircle,
  info: Circle,
  muted: Circle,
  success: CheckCircle2,
  warning: Clock,
} as const;

export type StatusBadgeTone = keyof typeof statusTone;

export function StatusBadge({
  className,
  label,
  tone = "muted",
}: {
  className?: string;
  label: string;
  tone?: StatusBadgeTone;
}) {
  const Icon = statusIcon[tone];

  return (
    <Badge className={cn(statusTone[tone], className)} variant="secondary">
      <Icon className="size-3" />
      {label}
    </Badge>
  );
}
