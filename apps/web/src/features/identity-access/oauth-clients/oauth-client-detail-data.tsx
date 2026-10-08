"use client";

import { useCallback } from "react";
import { ConsoleDataLoader } from "@/features/auth/console-data-loader";
import { getOAuthClient } from "./api";
import { OAuthClientDetailClient } from "./oauth-client-detail-client";

export function OAuthClientDetailData({ id, locale }: { id: string; locale: string }) {
  const load = useCallback(
    (signal: AbortSignal) => getOAuthClient(id, { signal }),
    [id]
  );
  return (
    <ConsoleDataLoader load={load} title="No se pudo cargar el cliente OAuth">
      {(client, refresh) => (
        <OAuthClientDetailClient client={client} locale={locale} onRefresh={refresh} />
      )}
    </ConsoleDataLoader>
  );
}
