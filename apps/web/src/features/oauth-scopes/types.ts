export type ScopeReference = { audience: string; code: string };
export type OAuthScope = {
  id: string;
  code: string;
  name: string;
  description: string;
  enabled: boolean;
  kind: "protocol" | "api";
};
export type ApiScope = OAuthScope &
  ScopeReference & { resource: string | null };
export type OAuthApi = {
  id: string;
  name: string;
  audience: string;
  resource: string | null;
  enabled: boolean;
  scopes: string[];
};
export const scopeKey = (scope: ScopeReference) =>
  JSON.stringify([scope.audience, scope.code]);
export function resolveApiScopes(
  scopes: OAuthScope[],
  apis: OAuthApi[],
): ApiScope[] {
  return apis.flatMap((api) =>
    scopes
      .filter(
        (scope) => scope.kind === "api" && api.scopes.includes(scope.code),
      )
      .map((scope) => ({
        ...scope,
        id: `${api.id}:${scope.id}`,
        audience: api.audience,
        resource: api.resource,
        enabled: scope.enabled && api.enabled,
      })),
  );
}
