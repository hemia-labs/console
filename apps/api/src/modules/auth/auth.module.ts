import {
  MiddlewareConsumer,
  Module,
  RequestMethod,
  type NestModule,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SsoModule, SESSION_STORE } from '@hemia/auth/nestjs';
import type { SsoConfig } from '@hemia/auth';
import { RedisModule } from './session/redis.module';
import { RedisSessionStore } from './session/redis-session-store';
import { MeController } from './me.controller';
import { ConsoleAuthorizationService } from './authorization/console-authorization.service';
import { ConsoleAdminGuard } from './authorization/console-admin.guard';
import { AuthSessionMiddleware } from './session/auth-session.middleware';

@Module({
  imports: [
    SsoModule.forRootAsync({
      imports: [ConfigModule, RedisModule],
      inject: [ConfigService],
      store: { provide: SESSION_STORE, useExisting: RedisSessionStore },
      useFactoryConfig: (config: ConfigService): SsoConfig =>
        config.getOrThrow<SsoConfig>('sso'),
    }),
  ],
  controllers: [MeController],
  providers: [
    ConsoleAuthorizationService,
    ConsoleAdminGuard,
    AuthSessionMiddleware,
  ],
  exports: [SsoModule, ConsoleAuthorizationService, ConsoleAdminGuard],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthSessionMiddleware)
      .forRoutes({ method: RequestMethod.GET, path: 'auth/session' });
  }
}
