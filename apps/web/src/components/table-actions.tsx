import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function TableActions({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-12 items-center justify-end gap-2", className)}>
      {children}
    </div>
  );
}
