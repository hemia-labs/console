import type { Request } from 'express';

export interface AuditTarget {
  action: string;
  resource: string;
  resourceId?: string | null;
  route: string;
}

const ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const getAuditTarget = (request: Request): AuditTarget => {
  const route = (request.originalUrl ?? request.url ?? '').split('?')[0];
  const segments = route.split('/').filter(Boolean);
  const namespaceIndex = segments.findIndex((segment) =>
    ['access', 'identity-access'].includes(segment),
  );
  const namespace = namespaceIndex >= 0 ? segments[namespaceIndex] : undefined;
  const resourceSegments =
    namespaceIndex >= 0 ? segments.slice(namespaceIndex + 1) : segments;
  const resource = resourceSegments[0] ?? namespace ?? 'unknown';
  const normalizedRoute = resourceSegments
    .map((segment) => (isResourceId(segment) ? ':id' : segment))
    .join('.');

  return {
    action: `${request.method.toLowerCase()}.${normalizedRoute}`,
    resource,
    resourceId: resourceSegments.find(isResourceId) ?? null,
    route,
  };
};

const isResourceId = (value: string): boolean =>
  ID_PATTERN.test(value) || /^[0-9]+$/.test(value);
