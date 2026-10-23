import { SystemCatalogLock } from './system-catalog.lock';
import { RedisModule } from '../auth/session/redis.module';
import { ConsoleServiceClient } from './console-service.client';
import { BillingAdminClient } from './billing-admin.client';
import { SystemConnectionsService } from './system-connections.service';
import { CapabilityClientsService } from './capability-clients.service';
import { HemiaIdModule } from '../../integrations/hemia-id/hemia-id.module';
import { SystemOAuthService } from './system-oauth.service';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LegalSystemCatalogClient } from './legal-system-catalog.client';
import { LegalSystemCatalogController } from './legal-system-catalog.controller';
@Module({
  imports: [AuthModule, HemiaIdModule, RedisModule],
  controllers: [LegalSystemCatalogController],
  providers: [
    SystemCatalogLock,
    ConsoleServiceClient,
    BillingAdminClient,
    SystemConnectionsService,
    LegalSystemCatalogClient,
    SystemOAuthService,
    CapabilityClientsService,
  ],
})
export class LegalSystemCatalogModule {}
