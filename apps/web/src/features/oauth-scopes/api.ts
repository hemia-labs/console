import { consoleApi } from "@/lib/console-api";
import type { OAuthScope } from "./types";
export const getOAuthScopes = (signal?: AbortSignal) =>
  consoleApi.get<OAuthScope[]>("/identity-access/oauth-scopes", { signal });
export const saveOAuthScope = (value: Omit<OAuthScope, "id">, id?: string) =>
  id
    ? consoleApi.put<OAuthScope>(
        `/identity-access/oauth-scopes/${encodeURIComponent(id)}`,
        value,
      )
    : consoleApi.post<OAuthScope>("/identity-access/oauth-scopes", value);
