"use client";

import { useCallback } from "react";
import { ConsoleDataLoader } from "@/features/auth/console-data-loader";
import { getOAuthScopes, getOAuthApis } from "@/features/oauth-scopes/api";
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
      const [client, scopeCatalog, apiCatalog] = await Promise.all([
        getOAuthClient(id, { signal }),
        getOAuthScopes(signal),
        getOAuthApis(signal),
      ]);
      return { client, scopeCatalog, apiCatalog };
    },
    [id],
  );
  return (
    <ConsoleDataLoader load={load} title="No se pudo cargar el cliente OAuth">
      {(data) => <OAuthClientEditClient cancelHref={cancelHref} {...data} />}
    </ConsoleDataLoader>
  );
}
