import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditContextModule } from './common/audit/audit-context.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import hemiaIdConfig from './config/hemia-id.config';
import ssoConfig from './config/sso.config';
import redisConfig from './config/redis.config';
import { envVarsSchema } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuditModule } from './modules/audit/audit.module';
import { IdentityAccessModule } from './modules/identity-access/identity-access.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
      load: [appConfig, hemiaIdConfig, ssoConfig, redisConfig, databaseConfig],
      validationSchema: envVarsSchema,
      validationOptions: { allowUnknown: true, abortEarly: true },
    }),
    AuditContextModule,
    DatabaseModule,
    AuthModule,
    AuditModule,
    IdentityAccessModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
