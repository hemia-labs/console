"use client";

import { useCallback } from "react";
import { ConsoleDataLoader } from "@/features/auth/console-data-loader";
import { getOAuthScopes } from "@/features/oauth-scopes/api";
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
    async (signal: AbortSignal) => {
      const [client, scopeCatalog] = await Promise.all([
        getOAuthClient(id, { signal }),
        getOAuthScopes(signal),
      ]);
      return { client, scopeCatalog };
    },
    [id],
  );
  return (
    <ConsoleDataLoader load={load} title="No se pudo cargar el cliente OAuth">
      {(data) => <OAuthClientEditClient cancelHref={cancelHref} {...data} />}
    </ConsoleDataLoader>
  );
}
