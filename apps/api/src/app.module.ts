import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import appConfig from './config/app.config';
import hemiaIdConfig from './config/hemia-id.config';
import accessAdminConfig from './config/access-admin.config';
import ssoConfig from './config/sso.config';
import legalAdminConfig from './config/legal-admin.config';
import { LegalSystemCatalogModule } from './modules/legal-system-catalog/legal-system-catalog.module';
import redisConfig from './config/redis.config';
import { envVarsSchema } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { IdentityAccessModule } from './modules/identity-access/identity-access.module';
import { AccessModule } from './modules/access/access.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
      load: [
        appConfig,
        hemiaIdConfig,
        accessAdminConfig,
        ssoConfig,
        redisConfig,
        legalAdminConfig,
      ],
      validationSchema: envVarsSchema,
      validationOptions: { allowUnknown: true, abortEarly: true },
    }),
    AuthModule,
    IdentityAccessModule,
    AccessModule,
    LegalSystemCatalogModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
