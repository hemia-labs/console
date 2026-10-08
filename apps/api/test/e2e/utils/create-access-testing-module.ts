import { ConsoleAuthorizationService } from '../../../src/modules/auth/console-authorization.service';
import { ConfigModule } from '@nestjs/config';
import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { SsoAuthGuard } from '@hemia/auth/nestjs';
import type { Request } from 'express';
import { Test } from '@nestjs/testing';
import accessAdminConfig from '../../../src/config/access-admin.config';
import hemiaIdConfig from '../../../src/config/hemia-id.config';
import redisConfig from '../../../src/config/redis.config';
import ssoConfig from '../../../src/config/sso.config';
import { AccessModule } from '../../../src/modules/access/access.module';
import { REDIS } from '../../../src/modules/auth/redis-session-store';

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
          .getRequest<Request & { user?: { sub: string } }>();
        if (!request.headers.authorization && !request.headers.cookie) {
          throw new UnauthorizedException('Missing auth');
        }
        request.user = { sub: 'console-user' };
        return true;
      }),
    });
