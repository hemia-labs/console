# API (NestJS)

Backend de Console: BFF administrativo para Hemia ID y Hemia Access.
No requiere PostgreSQL ni guarda eventos de auditoría locales.

## Stack

- **NestJS 11**, TypeScript y `@nestjs/config`.
- **Redis** para sesiones SSO, estado PKCE y coordinación de refresh de tokens.
- **class-validator / class-transformer** para validar DTOs.
- **Jest**, **ESLint + Prettier** y **bun**.

## Variables de entorno

Copia `.env.example` a `.env` y configura las URLs y credenciales de Hemia ID,
Hemia Access y SSO. Configura Redis con `REDIS_HOST`, `REDIS_PORT`,
`REDIS_PASSWORD` y `REDIS_DB`.

`PORT` es opcional (default `3016`). `.env` y `.env.local` están en `.gitignore`.
No se requieren variables `DB_*` ni migraciones.

El ejemplo conserva solo la configuración explícita habitual. Los endpoints OAuth
se derivan de `HEMIA_ID_BASE_URL`: `/oauth/authorize`, `/oauth/token`,
`/oauth/revoke`, `/oauth/logout` y `/.well-known/jwks.json`. Las claves públicas de
Access se consultan en `${ACCESS_API_URL}/.well-known/jwks.json`.
`ACCESS_TOKEN_URL` es opcional; sin override usa el endpoint de Identity.
Los tres secretos corresponden a clientes distintos registrados en Identity:
`console`, `console-identity-admin` y `console-access-admin`.

## Arranque

```bash
bun install
bun run --cwd apps/api start:dev
```

Console requiere Redis y acceso a los servicios configurados de identidad y acceso.
La eliminación de la auditoría local no borra tablas ni eventos ya existentes en
una antigua base PostgreSQL; su conservación o eliminación se administra aparte.

## Tests y build

```bash
bun run --cwd apps/api build
bun run --cwd apps/api test
bun run --cwd apps/api test:e2e
```

Las pruebas usan servicios upstream y Redis simulados.

## Organización de pruebas y módulos

Todas las pruebas del proyecto están en `../../test/`: API en `api/unit` y `api/e2e`, y frontend en `web`. Las configuraciones Jest y TypeScript de pruebas están junto a los tests. Los comandos de pruebas anteriores siguen funcionando. Los controladores y servicios de cada recurso se agrupan en carpetas dentro de su módulo, junto a sus DTOs y tipos específicos.
