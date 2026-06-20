import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConsoleApiError } from "@/lib/console-api.types";
import { cn } from "@/lib/utils";

function messageFor(error?: unknown) {
  if (error instanceof ConsoleApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "No se pudo cargar la informacion.";
}

export function ErrorState({
  actionLabel,
  className,
  error,
  onRetry,
  title = "Algo salio mal",
}: {
  actionLabel?: string;
  className?: string;
  error?: unknown;
  onRetry?: () => void;
  title?: string;
}) {
  return (
    <div
      className={cn(
        "grid min-h-48 place-items-center rounded-lg border border-border bg-card p-6 text-center shadow-sm",
        className
      )}
      role="alert"
    >
      <div className="flex max-w-md flex-col items-center gap-3">
        <span className="grid size-12 place-items-center rounded-full bg-red-50 text-red-600">
          <AlertTriangle className="size-5" />
        </span>
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{messageFor(error)}</p>
        </div>
        {onRetry ? (
          <Button className="h-12" onClick={onRetry} type="button" variant="outline">
            {actionLabel ?? "Reintentar"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
