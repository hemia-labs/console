import { consoleApi } from "@/lib/console-api";
import { resolveApiScopes, type OAuthScope, type OAuthApi } from "./types";
export const getOAuthScopes = (signal?: AbortSignal) =>
  consoleApi.get<OAuthScope[]>("/identity-access/oauth-scopes", { signal });
export const saveOAuthScope = (
  value: Omit<OAuthScope, "id" | "kind">,
  id?: string,
) =>
  id
    ? consoleApi.put<OAuthScope>(
        `/identity-access/oauth-scopes/${encodeURIComponent(id)}`,
        value,
      )
    : consoleApi.post<OAuthScope>("/identity-access/oauth-scopes", value);

export const getOAuthApis = (signal?: AbortSignal) =>
  consoleApi.get<OAuthApi[]>("/identity-access/oauth-apis", { signal });
export const saveOAuthApi = (value: Omit<OAuthApi, "id">, id?: string) =>
  id
    ? consoleApi.put<OAuthApi>(
        `/identity-access/oauth-apis/${encodeURIComponent(id)}`,
        value,
      )
    : consoleApi.post<OAuthApi>("/identity-access/oauth-apis", value);
export async function getApiScopes(signal?: AbortSignal) {
  const [scopes, apis] = await Promise.all([
    getOAuthScopes(signal),
    getOAuthApis(signal),
  ]);
  return resolveApiScopes(scopes, apis);
}
