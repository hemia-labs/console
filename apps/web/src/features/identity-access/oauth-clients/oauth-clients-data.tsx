"use client";

import { ConsoleDataLoader } from "@/features/auth/console-data-loader";
import { listOAuthClients } from "./api";
import { OAuthClientsClient } from "./oauth-clients-client";

const load = (signal: AbortSignal) => listOAuthClients({}, { signal });
export function OAuthClientsData({ locale }: { locale: string }) {
  return (
    <ConsoleDataLoader load={load} title="No se pudo cargar OAuth clients">
      {(clients, refresh) => (
        <OAuthClientsClient
          clients={clients}
          locale={locale}
          onRefresh={refresh}
        />
      )}
    </ConsoleDataLoader>
  );
}
