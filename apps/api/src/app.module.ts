import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import hemiaIdConfig from './config/hemia-id.config';
import { envVarsSchema } from './config/env.validation';
import { IdentityAccessModule } from './modules/identity-access/identity-access.module';
// import { DatabaseModule } from './database/database.module';

@Module({
  // ponytail: DatabaseModule comentado hasta tener DB; descomentar y setear DB_* en .env
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
      load: [hemiaIdConfig],
      validationSchema: envVarsSchema,
      validationOptions: { allowUnknown: true, abortEarly: true },
    }),
    IdentityAccessModule,
    /* DatabaseModule */
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
