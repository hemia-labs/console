import type { Request } from 'express';

export interface AuditActor {
  actorSubject?: string | null;
  actorSource: 'authorization' | 'cookie' | 'none';
}

export const extractAuditActor = (request: Request): AuditActor => {
  const authorization = request.headers.authorization;
  const bearerToken = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : undefined;
  const bearerSub = decodeJwtSubject(bearerToken);

  if (bearerSub) {
    return { actorSubject: bearerSub, actorSource: 'authorization' };
  }

  const cookieToken = extractCookie(request.headers.cookie, 'access_token');
  const cookieSub = decodeJwtSubject(cookieToken);

  if (cookieSub) {
    return { actorSubject: cookieSub, actorSource: 'cookie' };
  }

  return {
    actorSubject: null,
    actorSource: bearerToken || cookieToken ? 'authorization' : 'none',
  };
};

const extractCookie = (
  cookieHeader: string | undefined,
  key: string,
): string | undefined => {
  if (!cookieHeader) {
    return undefined;
  }

  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${key}=`))
    ?.slice(key.length + 1);
};

const decodeJwtSubject = (token: string | undefined): string | undefined => {
  if (!token) {
    return undefined;
  }

  const [, payload] = token.split('.');
  if (!payload) {
    return undefined;
  }

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      '=',
    );
    const parsed = JSON.parse(Buffer.from(padded, 'base64').toString('utf8')) as {
      sub?: unknown;
    };

    return typeof parsed.sub === 'string' ? parsed.sub : undefined;
  } catch {
    return undefined;
  }
};
