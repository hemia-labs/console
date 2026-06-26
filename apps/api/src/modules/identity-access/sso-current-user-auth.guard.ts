import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Session, SsoConfig } from '@hemia/auth';
import { RedisSessionStore } from '../auth/redis-session-store';

type RequestWithUser = {
  cookies?: Record<string, string>;
  user?: unknown;
};

@Injectable()
export class SsoCurrentUserAuthGuard implements CanActivate {
  constructor(
    private readonly store: RedisSessionStore,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const { cookieName } = this.config.getOrThrow<SsoConfig>('sso');
    const sessionId = request.cookies?.[cookieName];
    const session = sessionId
      ? await this.store.get<Session>(`sso:session:${sessionId}`)
      : null;

    if (!session) {
      throw new UnauthorizedException('Invalid session');
    }

    request.user = {
      ...session.user,
      accessToken: session.accessToken,
      authorization: `Bearer ${session.accessToken}`,
    };

    return true;
  }
}
