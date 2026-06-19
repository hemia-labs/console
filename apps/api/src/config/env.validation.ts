import * as Joi from 'joi';

export const envVarsSchema = Joi.object({
  HEMIA_ID_BASE_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .default('http://localhost:3000'),
  HEMIA_ID_ADMIN_PREFIX: Joi.string().default('/api/v1'),
  HEMIA_ID_TIMEOUT_MS: Joi.number().integer().min(1000).default(5000),
  HEMIA_ID_EXTERNAL_CLIENT_ID: Joi.string().optional().allow(''),
  HEMIA_ID_EXTERNAL_CLIENT_SECRET: Joi.string().optional().allow(''),
  HEMIA_ID_EXTERNAL_SCOPES: Joi.string().optional().allow(''),
  HEMIA_ID_EXTERNAL_TOKEN_URL: Joi.string().default('/oauth/token'),
});
