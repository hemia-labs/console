import { ConsoleAuthorizationService } from '../../../../apps/api/src/modules/auth/authorization/console-authorization.service';
import type { ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { SsoAuthGuard } from '@hemia/auth/nestjs';
import hemiaIdConfig from '../../../../apps/api/src/config/hemia-id.config';
import redisConfig from '../../../../apps/api/src/config/redis.config';
import ssoConfig from '../../../../apps/api/src/config/sso.config';
import { IdentityAccessModule } from '../../../../apps/api/src/modules/identity-access/identity-access.module';
import { REDIS } from '../../../../apps/api/src/modules/auth/session/redis-session-store';

export const createIdentityAccessE2eTestingModule = () =>
  Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        load: [hemiaIdConfig, redisConfig, ssoConfig],
      }),
      IdentityAccessModule,
    ],
  })
    .overrideProvider(ConsoleAuthorizationService)
    .useValue({ authorize: jest.fn().mockResolvedValue(undefined) })
    .overrideProvider(REDIS)
    .useValue({
      del: jest.fn().mockResolvedValue(1),
      get: jest.fn().mockResolvedValue(null),
      quit: jest.fn().mockResolvedValue('OK'),
      set: jest.fn().mockResolvedValue('OK'),
    })
    .overrideProvider(SsoAuthGuard)
    .useValue({
      canActivate: jest.fn((context: ExecutionContext) => {
        const request = context
          .switchToHttp()
          .getRequest<
            Request & { user?: { authorization?: string; cookie?: string } }
          >();
        request.user = {
          authorization: request.headers.authorization,
          cookie: request.headers.cookie,
        };
        return true;
      }),
    });
