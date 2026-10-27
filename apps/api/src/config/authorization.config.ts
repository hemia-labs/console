import { registerAs } from '@nestjs/config';

export default registerAs('authorization', () => ({
  mode: process.env.HEMIA_AUTHORIZATION_MODE || 'roles',
}));
