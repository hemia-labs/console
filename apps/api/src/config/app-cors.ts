import { ConfigService } from '@nestjs/config';

export interface AppCorsOptions {
  origin: string[];
  credentials: boolean;
}

export const buildAppCorsOptions = (config: ConfigService): AppCorsOptions => {
  const origins = config.get<string[]>('app.corsOrigins') ?? [
    'http://localhost:5176',
  ];
  const credentials = config.get<boolean>('app.corsCredentials') ?? true;

  return {
    origin: credentials ? origins.filter((origin) => origin !== '*') : origins,
    credentials,
  };
};
