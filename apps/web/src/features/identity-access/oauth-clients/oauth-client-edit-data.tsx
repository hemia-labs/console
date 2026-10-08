"use client";

import { useCallback } from "react";
import { ConsoleDataLoader } from "@/features/auth/console-data-loader";
import { getOAuthClient } from "./api";
import { OAuthClientEditClient } from "./oauth-client-edit-client";

export function OAuthClientEditData({
  id,
  cancelHref,
}: {
  id: string;
  cancelHref: string;
}) {
  const load = useCallback(
    (signal: AbortSignal) => getOAuthClient(id, { signal }),
    [id]
  );
  return (
    <ConsoleDataLoader load={load} title="No se pudo cargar el cliente OAuth">
      {(client) => (
        <OAuthClientEditClient cancelHref={cancelHref} client={client} />
      )}
    </ConsoleDataLoader>
  );
}
