"use client";

import { CheckCircle2 } from "lucide-react";
import { ConsoleDataLoader } from "@/features/auth/console-data-loader";
import { CapabilityList } from "./capability-list";
import { getCapabilities } from "./capabilities-api";

export function CapabilitiesClient({
  listHref,
  saved = false,
}: {
  listHref: string;
  saved?: boolean;
}) {
  return (
    <div className="space-y-5">
      {saved && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm"
        >
          <CheckCircle2
            className="size-4 shrink-0 text-primary"
            aria-hidden="true"
          />
          Capacidad guardada.
        </div>
      )}
      <ConsoleDataLoader
        load={getCapabilities}
        title="No se pudieron cargar las capacidades"
      >
        {(capabilities) => (
          <CapabilityList capabilities={capabilities} listHref={listHref} />
        )}
      </ConsoleDataLoader>
    </div>
  );
}
