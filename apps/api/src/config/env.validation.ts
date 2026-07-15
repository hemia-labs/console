import * as Joi from 'joi';

const requiredInProd = (fallback: string) =>
  Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.string().empty('').default(fallback),
  });

export const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().integer().min(1).max(65535).default(3001),
  APP_CORS_ORIGINS: Joi.string().default('http://localhost:3000'),
  APP_CORS_CREDENTIALS: Joi.boolean().default(false),
  HEMIA_ID_BASE_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .default('http://localhost:3000'),
  HEMIA_ID_ADMIN_PREFIX: Joi.string().default('/api/v1'),
  HEMIA_ID_TIMEOUT_MS: Joi.number().integer().min(1000).default(5000),
  SSO_IDENTITY_ADMIN_SERVICE_SECRET: Joi.string().optional().allow(''),
  HEMIA_ID_EXTERNAL_CLIENT_ID: Joi.string().optional().allow(''),
  HEMIA_ID_EXTERNAL_CLIENT_SECRET: Joi.string().optional().allow(''),
  HEMIA_ID_EXTERNAL_SCOPES: Joi.string().optional().allow(''),
  HEMIA_ID_EXTERNAL_TOKEN_URL: Joi.string().default('/oauth/token'),
  SSO_ISSUER: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .optional(),
  SSO_CLIENT_ID: requiredInProd('hemia-console'),
  SSO_CLIENT_SECRET: Joi.string().optional().allow(''),
  SSO_AUDIENCE: requiredInProd('hemia-console'),
  SSO_JWKS_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .empty('')
    .optional(),
  SSO_AUTHORIZATION_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .empty('')
    .optional(),
  SSO_TOKEN_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .empty('')
    .optional(),
  SSO_REVOCATION_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .empty('')
    .optional(),
  SSO_LOGOUT_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .empty('')
    .optional(),
  SSO_REDIRECT_URI: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .default('http://localhost:3001/auth/callback'),
  SSO_FRONTEND_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .default('http://localhost:3000'),
  SSO_SCOPE: Joi.string()
    .empty('')
    .default('openid profile email offline_access console.access'),
  SSO_COOKIE_NAME: Joi.string().empty('').default('console_session'),
  SSO_SESSION_TTL_SECONDS: Joi.number().integer().positive().default(604800),
  SSO_COOKIE_SECURE: Joi.boolean().default(false),
  ACCESS_API_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .default('http://localhost:3019'),
  ACCESS_JWKS_URI: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .empty('')
    .optional(),
  ACCESS_AUDIENCE: Joi.string().empty('').default('access-api'),
  PRODUCT_CODE: Joi.string().empty('').default('console'),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().integer().min(1).max(65535).default(6379),
  REDIS_PASSWORD: Joi.string().optional().allow(''),
  REDIS_DB: Joi.number().integer().min(0).default(0),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().integer().min(1).max(65535).default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),
  DB_LOGGING: Joi.boolean().default(false),
});
