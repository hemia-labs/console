import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuditRequestContext } from '../../common/audit/audit-request-context';
import { AuditService } from './audit.service';
import { AuditEventStatus } from './types/audit-event-status';
import { extractAuditActor } from './utils/audit-actor.util';
import { sanitizeAuditMetadata } from './utils/audit-sanitize.util';
import { getAuditTarget } from './audit-target.util';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly auditService: AuditService,
    private readonly auditRequestContext: AuditRequestContext,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();

    if (!this.shouldAudit(request)) {
      return next.handle();
    }

    return new Observable((subscriber) =>
      this.auditRequestContext.run(() =>
        next
          .handle()
          .pipe(
            tap(() => {
              void this.record(request, AuditEventStatus.Success);
            }),
            catchError((error) => {
              void this.record(request, AuditEventStatus.Failure, error);
              return throwError(() => error);
            }),
          )
          .subscribe(subscriber),
      ),
    );
  }

  private shouldAudit(request: Request): boolean {
    return (
      ['POST', 'PATCH', 'DELETE'].includes(request.method) &&
      (request.originalUrl ?? request.url ?? '').startsWith('/identity-access')
    );
  }

  private async record(
    request: Request,
    status: AuditEventStatus,
    error?: unknown,
  ): Promise<void> {
    const upstreamCalls = this.auditRequestContext.getUpstreamCalls();
    if (upstreamCalls.length === 0) {
      return;
    }

    const latestUpstreamCall = upstreamCalls[upstreamCalls.length - 1];
    const actor = extractAuditActor(request);
    const target = getAuditTarget(request);

    await this.auditService.record({
      ...actor,
      ...target,
      status,
      httpMethod: request.method,
      hemiaIdPath: latestUpstreamCall.path,
      hemiaIdRequestId: latestUpstreamCall.requestId,
      metadata: sanitizeAuditMetadata({
        upstreamCalls,
      }),
      errorCode: this.getErrorCode(error),
      errorMessage: this.getErrorMessage(error),
    });
  }

  private getErrorCode(error: unknown): string | null {
    if (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      typeof error.status === 'number'
    ) {
      return String(error.status);
    }

    return null;
  }

  private getErrorMessage(error: unknown): unknown {
    if (typeof error !== 'object' || error === null) {
      return error;
    }

    if ('response' in error) {
      const response = error.response as { message?: unknown };
      return response.message;
    }

    if ('message' in error) {
      return error.message;
    }

    return undefined;
  }
}
