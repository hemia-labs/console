import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConsoleSsoExceptionFilter } from './modules/auth/console-sso-exception.filter';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { buildAppCorsOptions } from './config/app-cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.use(cookieParser()); // SsoAuthGuard reads req.cookies
  app.useGlobalFilters(new ConsoleSsoExceptionFilter());
  app.enableCors(buildAppCorsOptions(config));
  await app.listen(config.get<number>('app.port') ?? 3016);
}
void bootstrap();
