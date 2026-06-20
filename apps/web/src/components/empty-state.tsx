import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

import { cn } from "@/lib/utils";

export function EmptyState({
  action,
  className,
  description = "Cuando haya informacion disponible aparecera aqui.",
  icon,
  title = "Sin resultados",
}: {
  action?: ReactNode;
  className?: string;
  description?: string;
  icon?: ReactNode;
  title?: string;
}) {
  return (
    <div
      className={cn(
        "grid min-h-48 place-items-center rounded-lg border border-border bg-card p-6 text-center shadow-sm",
        className
      )}
    >
      <div className="flex max-w-md flex-col items-center gap-3">
        <span className="grid size-12 place-items-center rounded-full bg-secondary text-primary">
          {icon ?? <Inbox className="size-5" />}
        </span>
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>
    </div>
  );
}
