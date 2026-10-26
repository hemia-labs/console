import { ServiceUnavailableException } from '@nestjs/common';
import type { HemiaIdAdminClient } from './hemia-id-admin.client';
export type CatalogScope = {
  code: string;
  name: string;
  description: string;
  id: string;
  enabled: boolean;
  kind: 'api' | 'protocol';
};
export type CatalogApi = {
  id: string;
  name: string;
  audience: string;
  resource: string | null;
  enabled: boolean;
  scopes: string[];
};
export async function loadApiScopes(identity: HemiaIdAdminClient) {
  const [scopes, apis] = await Promise.all([
    identity.requestService<CatalogScope[]>({
      method: 'GET',
      path: '/oauth-scopes',
    }),
    identity.requestService<CatalogApi[]>({
      method: 'GET',
      path: '/oauth-apis',
    }),
  ]);
  if (
    !Array.isArray(scopes) ||
    !Array.isArray(apis) ||
    apis.some((api) => !Array.isArray(api.scopes))
  )
    throw new ServiceUnavailableException('Catálogo OAuth no disponible.');
  return apis.flatMap((api) =>
    scopes
      .filter(
        (scope) => scope.kind === 'api' && api.scopes.includes(scope.code),
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
