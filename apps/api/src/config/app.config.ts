import { registerAs } from '@nestjs/config';

const splitOrigins = (value: string | undefined): string[] =>
  (value ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

export default registerAs('app', () => ({
  port: Number(process.env.PORT) || 3001,
  corsOrigins: splitOrigins(process.env.APP_CORS_ORIGINS),
  corsCredentials: process.env.APP_CORS_CREDENTIALS === 'true',
}));
