import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { SsoAuthGuard } from '@hemia/auth/nestjs';
import { AuditContextModule } from '../../../src/common/audit/audit-context.module';
import hemiaIdConfig from '../../../src/config/hemia-id.config';
import redisConfig from '../../../src/config/redis.config';
import ssoConfig from '../../../src/config/sso.config';
import { AuditInterceptor } from '../../../src/modules/audit/audit.interceptor';
import { AuditService } from '../../../src/modules/audit/audit.service';
import { IdentityAccessModule } from '../../../src/modules/identity-access/identity-access.module';
import { REDIS } from '../../../src/modules/auth/redis-session-store';

export const createIdentityAccessE2eTestingModule = () =>
  Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        load: [hemiaIdConfig, redisConfig, ssoConfig],
      }),
      AuditContextModule,
      IdentityAccessModule,
    ],
    providers: [
      {
        provide: AuditService,
        useValue: {
          record: jest.fn().mockResolvedValue(undefined),
        },
      },
      {
        provide: APP_INTERCEPTOR,
        useClass: AuditInterceptor,
      },
    ],
  })
    .overrideProvider(REDIS)
    .useValue({
      del: jest.fn().mockResolvedValue(1),
      get: jest.fn().mockResolvedValue(null),
      quit: jest.fn().mockResolvedValue('OK'),
      set: jest.fn().mockResolvedValue('OK'),
    })
    .overrideProvider(SsoAuthGuard)
    .useValue({
      canActivate: jest.fn((context) => {
        const request = context.switchToHttp().getRequest();
        request.user = {
          authorization: request.headers.authorization,
          cookie: request.headers.cookie,
        };
        return true;
      }),
    });
