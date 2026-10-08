import { extractAuditActor } from 'src/modules/audit/utils/audit-actor.util';

describe('extractAuditActor', () => {
  it('uses the validated SSO subject ahead of spoofed browser headers', () => {
    expect(
      extractAuditActor({
        user: { sub: 'validated-user' },
        ssoAuth: { cookie: 'opaque-session' },
        headers: { authorization: `Bearer ${jwt({ sub: 'spoofed-user' })}` },
      } as never),
    ).toEqual({ actorSubject: 'validated-user', actorSource: 'cookie' });
  });

  it('extracts sub from bearer JWT without verifying signature', () => {
    const token = jwt({ sub: 'user-sub' });

    expect(
      extractAuditActor({
        headers: { authorization: `Bearer ${token}` },
      } as never),
    ).toEqual({
      actorSubject: 'user-sub',
      actorSource: 'authorization',
    });
  });

  it('falls back to access_token cookie', () => {
    const token = jwt({ sub: 'cookie-sub' });

    expect(
      extractAuditActor({
        headers: { cookie: `other=value; access_token=${token}` },
      } as never),
    ).toEqual({
      actorSubject: 'cookie-sub',
      actorSource: 'cookie',
    });
  });

  it('returns null subject when token cannot be decoded', () => {
    expect(
      extractAuditActor({
        headers: { authorization: 'Bearer invalid-token' },
      } as never),
    ).toEqual({
      actorSubject: null,
      actorSource: 'authorization',
    });
  });
});

const jwt = (payload: Record<string, unknown>): string =>
  [encode({ alg: 'none', typ: 'JWT' }), encode(payload), ''].join('.');

const encode = (value: Record<string, unknown>): string =>
  Buffer.from(JSON.stringify(value)).toString('base64url');
