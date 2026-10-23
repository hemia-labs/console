import { registerAs } from '@nestjs/config';
export default registerAs('legalAdmin', () => ({
  baseUrl: process.env.LEGAL_API_URL ?? 'http://localhost:3017',
  billingBaseUrl: process.env.BILLING_API_BASE_URL ?? 'http://localhost:3010',
}));
