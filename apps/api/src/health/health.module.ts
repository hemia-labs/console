import { Module } from '@nestjs/common';
import { RedisModule } from '../modules/auth/session/redis.module';
import { HealthController } from './health.controller';

@Module({ imports: [RedisModule], controllers: [HealthController] })
export class HealthModule {}
