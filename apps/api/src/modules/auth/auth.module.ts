import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SsoModule, SESSION_STORE } from '@hemia/auth/nestjs';
import type { SsoConfig } from '@hemia/auth';
import { RedisModule } from './redis.module';
import { RedisSessionStore } from './redis-session-store';
import { MeController } from './me.controller';

// Monta /auth/{login,callback,session,logout} y expone SsoAuthGuard/SsoClient (global).
// ponytail: el guard NO se aplica global en main.ts a propósito — eso protegería todos los
// endpoints existentes (incluido external/* servicio-a-servicio). Usá @UseGuards(SsoAuthGuard)
// por controlador cuando quieras proteger una ruta.
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
})
export class AuthModule {}
