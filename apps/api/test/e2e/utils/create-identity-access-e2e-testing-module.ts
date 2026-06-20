import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { AuditContextModule } from '../../../src/common/audit/audit-context.module';
import hemiaIdConfig from '../../../src/config/hemia-id.config';
import { AuditInterceptor } from '../../../src/modules/audit/audit.interceptor';
import { AuditService } from '../../../src/modules/audit/audit.service';
import { IdentityAccessModule } from '../../../src/modules/identity-access/identity-access.module';

export const createIdentityAccessE2eTestingModule = () =>
  Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        load: [hemiaIdConfig],
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
  });
