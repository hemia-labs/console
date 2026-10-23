"use client";

import { CheckCircle2 } from "lucide-react";
import { ConsoleDataLoader } from "@/features/auth/console-data-loader";
import { getCapabilities } from "./capabilities-api";
import { getSystems } from "./systems-api";
import { SystemList } from "./system-list";

async function loadSystems(signal: AbortSignal) {
  const [systems, capabilities] = await Promise.all([
    getSystems(signal),
    getCapabilities(signal),
  ]);
  return { systems, capabilities };
}

export function SystemsClient({
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
          Sistema guardado.
        </div>
      )}
      <ConsoleDataLoader
        load={loadSystems}
        title="No se pudieron cargar los sistemas"
      >
        {({ systems, capabilities }) => (
          <SystemList
            systems={systems}
            capabilities={capabilities}
            listHref={listHref}
          />
        )}
      </ConsoleDataLoader>
    </div>
  );
}
