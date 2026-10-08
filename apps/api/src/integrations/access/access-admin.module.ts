import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AccessAdminClient } from './access-admin.client';

@Module({
  imports: [ConfigModule],
  providers: [AccessAdminClient],
  exports: [AccessAdminClient],
})
export class AccessAdminModule {}
