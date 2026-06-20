import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HemiaIdAdminClient } from './hemia-id-admin.client';
import { HemiaIdExternalClient } from './hemia-id-external.client';

@Module({
  imports: [ConfigModule],
  providers: [HemiaIdAdminClient, HemiaIdExternalClient],
  exports: [HemiaIdAdminClient, HemiaIdExternalClient],
})
export class HemiaIdModule {}
