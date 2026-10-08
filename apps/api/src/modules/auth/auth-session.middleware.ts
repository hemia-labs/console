import { Inject, Injectable, type NestMiddleware } from '@nestjs/common';
import { SsoCore, type SsoConfig } from '@hemia/auth';
import { SSO_CONFIG } from '@hemia/auth/nestjs';
import type { Response } from 'express';
import {
  ConsoleAuthorizationService,
  type ConsoleRequest,
} from './console-authorization.service';
import { toConsoleUser } from './console-user';

@Injectable()
export class AuthSessionMiddleware implements NestMiddleware {
  constructor(
    private readonly sso: SsoCore,
    private readonly authorization: ConsoleAuthorizationService,
    @Inject(SSO_CONFIG) private readonly config: SsoConfig,
  ) {}

  async use(request: ConsoleRequest, response: Response): Promise<void> {
    const cookie: unknown = request.cookies?.[this.config.cookieName];
    const session = await this.sso.getSession(
      typeof cookie === 'string' ? cookie : undefined,
    );
    request.user = session.user;
    request.ssoAuth = {
      accessToken: session.accessToken,
      cookie: session.id,
      authorization: `Bearer ${session.accessToken}`,
    };
    await this.authorization.authorize(request);
    response.setHeader('Cache-Control', 'no-store');
    response.json({ authenticated: true, user: toConsoleUser(session.user) });
  }
}
