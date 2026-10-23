export type ScopeReference = { audience: string; code: string };
export type OAuthScope = ScopeReference & {
  id: string;
  name: string;
  description: string;
  resource: string | null;
  enabled: boolean;
};
export const scopeKey = (scope: ScopeReference) =>
  JSON.stringify([scope.audience, scope.code]);
