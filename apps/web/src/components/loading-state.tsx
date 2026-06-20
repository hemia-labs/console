import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export function LoadingState({
  className,
  label = "Cargando...",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      aria-live="polite"
      className={cn(
        "grid min-h-48 place-items-center rounded-lg border border-border bg-card p-6 text-center shadow-sm",
        className
      )}
      role="status"
    >
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="size-6 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
