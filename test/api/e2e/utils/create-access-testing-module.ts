import { ConsoleAdminGuard } from '../../../../apps/api/src/modules/auth/authorization/console-admin.guard';
import { ConsoleAuthorizationService } from '../../../../apps/api/src/modules/auth/authorization/console-authorization.service';
import { ConfigModule } from '@nestjs/config';
import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { SsoAuthGuard } from '@hemia/auth/nestjs';
import type { Request } from 'express';
import { Test } from '@nestjs/testing';
import accessAdminConfig from '../../../../apps/api/src/config/access-admin.config';
import hemiaIdConfig from '../../../../apps/api/src/config/hemia-id.config';
import redisConfig from '../../../../apps/api/src/config/redis.config';
import ssoConfig from '../../../../apps/api/src/config/sso.config';
import { AccessModule } from '../../../../apps/api/src/modules/access/access.module';
import { REDIS } from '../../../../apps/api/src/modules/auth/session/redis-session-store';

const authenticatedGuard = {
  canActivate: jest.fn((context: ExecutionContext) => {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: { sub: string } }>();
    if (!request.headers.authorization && !request.headers.cookie)
      throw new UnauthorizedException('Missing auth');
    request.user = { sub: 'console-user' };
    return true;
  }),
};

export const createAccessTestingModule = () =>
  Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        load: [accessAdminConfig, hemiaIdConfig, redisConfig, ssoConfig],
      }),
      AccessModule,
    ],
  })
    .overrideProvider(ConsoleAuthorizationService)
    .useValue({
      authorize: jest.fn().mockResolvedValue(undefined),
      accessTokenFor: jest.fn().mockResolvedValue('exchanged-user-token'),
    })
    .overrideProvider(REDIS)
    .useValue({
      del: jest.fn().mockResolvedValue(1),
      get: jest.fn().mockResolvedValue(null),
      quit: jest.fn().mockResolvedValue('OK'),
      set: jest.fn().mockResolvedValue('OK'),
    })
    .overrideGuard(SsoAuthGuard)
    .useValue(authenticatedGuard)
    .overrideGuard(ConsoleAdminGuard)
    .useValue(authenticatedGuard);
