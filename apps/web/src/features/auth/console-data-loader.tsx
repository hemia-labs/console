"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ErrorState } from "@/components/error-state";

// This component mounts only inside the validated private session boundary.
export function ConsoleDataLoader<T>({
  load,
  children,
  title,
}: {
  load: (signal: AbortSignal) => Promise<T>;
  children: (data: T, refresh: () => void) => ReactNode;
  title: string;
}) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<
    | ({
        load: typeof load;
      } & ({ data: T; error?: never } | { error: Error; data?: never }))
    | null
  >(null);
  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setResult({ load, data });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setResult({
            load,
            error: error instanceof Error ? error : new Error(title),
          });
      });
    return () => controller.abort();
  }, [load, attempt, title]);
  const refresh = () => setAttempt((value) => value + 1);
  if (!result || result.load !== load) return <p role="status">Cargando…</p>;
  if (result.error)
    return <ErrorState error={result.error} title={title} onRetry={refresh} />;
  return children(result.data as T, refresh);
}
