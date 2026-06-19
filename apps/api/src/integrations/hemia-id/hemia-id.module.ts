import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HemiaIdAdminClient } from './hemia-id-admin.client';

@Module({
  imports: [ConfigModule],
  providers: [HemiaIdAdminClient],
  exports: [HemiaIdAdminClient],
})
export class HemiaIdModule {}
