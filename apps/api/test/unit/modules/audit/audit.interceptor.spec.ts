import { ExecutionContext } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { AuditRequestContext } from 'src/common/audit/audit-request-context';
import { AuditInterceptor } from 'src/modules/audit/audit.interceptor';
import { AuditService } from 'src/modules/audit/audit.service';
import { AuditEventStatus } from 'src/modules/audit/types/audit-event-status';

describe('AuditInterceptor', () => {
  let auditService: { record: jest.Mock };
  let auditRequestContext: AuditRequestContext;
  let interceptor: AuditInterceptor;

  beforeEach(() => {
    auditService = { record: jest.fn().mockResolvedValue(undefined) };
    auditRequestContext = new AuditRequestContext();
    interceptor = new AuditInterceptor(
      auditService as unknown as AuditService,
      auditRequestContext,
    );
  });

  it('records mutating identity-access success after upstream call', (done) => {
    const context = contextFor({
      method: 'POST',
      originalUrl: '/identity-access/users',
      headers: { authorization: `Bearer ${jwt({ sub: 'user-sub' })}` },
    });

    interceptor
      .intercept(context, {
        handle: () => {
          auditRequestContext.addUpstreamCall({
            source: 'admin',
            method: 'POST',
            path: '/users',
            requestId: 'req-id',
          });
          return of({ id: 'user-id' });
        },
      })
      .subscribe({
        complete: () => {
          setImmediate(() => {
            expect(auditService.record).toHaveBeenCalledWith(
              expect.objectContaining({
                actorSubject: 'user-sub',
                status: AuditEventStatus.Success,
                httpMethod: 'POST',
                route: '/identity-access/users',
                hemiaIdPath: '/users',
                hemiaIdRequestId: 'req-id',
              }),
            );
            done();
          });
        },
      });
  });

  it('records failure and rethrows original error', (done) => {
    const error = Object.assign(new Error('Forbidden'), {
      status: 403,
      response: { message: 'Forbidden' },
    });
    const context = contextFor({
      method: 'DELETE',
      originalUrl:
        '/identity-access/users/2df6e282-1517-48ff-9441-8cf80e65399f',
      headers: {},
    });

    interceptor
      .intercept(context, {
        handle: () => {
          auditRequestContext.addUpstreamCall({
            source: 'admin',
            method: 'DELETE',
            path: '/users/2df6e282-1517-48ff-9441-8cf80e65399f',
          });
          return throwError(() => error);
        },
      })
      .subscribe({
        error: (receivedError) => {
          setImmediate(() => {
            expect(receivedError).toBe(error);
            expect(auditService.record).toHaveBeenCalledWith(
              expect.objectContaining({
                status: AuditEventStatus.Failure,
                errorCode: '403',
                errorMessage: 'Forbidden',
                resourceId: '2df6e282-1517-48ff-9441-8cf80e65399f',
              }),
            );
            done();
          });
        },
      });
  });

  it('skips GET and validation failures without upstream calls', (done) => {
    const context = contextFor({
      method: 'GET',
      originalUrl: '/identity-access/users',
      headers: {},
    });

    interceptor
      .intercept(context, {
        handle: () => of({ ok: true }),
      })
      .subscribe({
        complete: () => {
          expect(auditService.record).not.toHaveBeenCalled();
          done();
        },
      });
  });
});

const contextFor = (request: Record<string, unknown>): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  }) as unknown as ExecutionContext;

const jwt = (payload: Record<string, unknown>): string =>
  [
    Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString(
      'base64url',
    ),
    Buffer.from(JSON.stringify(payload)).toString('base64url'),
    '',
  ].join('.');
