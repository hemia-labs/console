import { ArgumentsHost, Catch } from '@nestjs/common';
import {
  AccessContextError,
  ConfigError,
  UnauthorizedError,
} from '@hemia/auth';
import { SsoExceptionFilter } from '@hemia/auth/nestjs';
import type { Response } from 'express';

// SDK refresh also resolves Access before the operator authorization check runs.
@Catch(UnauthorizedError, ConfigError, AccessContextError)
export class ConsoleSsoExceptionFilter extends SsoExceptionFilter {
  catch(
    error: UnauthorizedError | ConfigError | AccessContextError,
    host: ArgumentsHost,
  ) {
    if (!(error instanceof AccessContextError)) return super.catch(error, host);
    const denied = error.status === 401 || error.status === 403;
    const status = denied ? 403 : 503;
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(status)
      .json({
        statusCode: status,
        code: denied ? 'access_denied' : 'access_unavailable',
        message: denied
          ? 'Platform superadministrator access required'
          : 'Console authorization unavailable',
      });
  }
}
