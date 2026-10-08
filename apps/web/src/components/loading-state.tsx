import { Spinner } from "@/components/zuno/spinner";

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
        <Spinner className="size-6 text-primary" label={label} />
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
