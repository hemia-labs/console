# nextjs-nestjs

Monorepo con **Next.js** (frontend) y **NestJS** (backend), gestionado con **bun workspaces**.

## Apps

| App | Stack | Puerto | README |
|-----|-------|--------|--------|
| [`apps/web`](apps/web) | Next.js 16, React 19, Tailwind v4, shadcn | 3000 | [ver](apps/web/README.md) |
| [`apps/api`](apps/api) | NestJS 11, TypeORM, PostgreSQL | 3001 | [ver](apps/api/README.md) |

> La base de datos del backend esta **activa** para auditoria local. Configura `DB_*` y ejecuta la migracion manual antes de levantar `apps/api`.

## Requisitos

- [bun](https://bun.sh)
- PostgreSQL para `apps/api`

## Arranque

```bash
bun install

bun run dev        # levanta web + api en paralelo
bun run dev:web    # solo frontend (http://localhost:3000)
bun run dev:api    # solo backend  (http://localhost:3001)
```

## Build

```bash
bun run build      # build de todas las apps
```

## Avance Identity & Access backend

`apps/api` ya incluye la integracion backend de **Hemia Console** con **Hemia ID** como sistema dueno de identidad y acceso. El backend funciona como gateway/admin BFF bajo el modulo `identity-access`.

Estado actual:

- Fase 0-13 implementadas: configuracion Hemia ID, cliente Admin API, External API M2M, modulo `identity-access`, health, tenants, users, organizations, teams, memberships, invitations, roles, permissions, OAuth clients, SSO clients, accounts y auditoria local.
- Cleanup terminado: tests backend centralizados en `apps/api/test`, con unit en `test/unit` y e2e en `test/e2e`; types/enums del modulo en `src/modules/identity-access/types`.
- DB/migraciones: no aplica para identidad real; Hemia ID sigue siendo el sistema dueno. DB local aplica solo para auditoria operativa y requiere migracion manual.
- Siguiente fase: **Fase 14 - Hardening y QA backend**.

Documentos de seguimiento:

- [Roadmap Identity & Access](roadmap_identity_access_hemia_id.md)
- [Progreso vivo](identity_access_development_progress.md)

## Estructura

```
nextjs-nestjs/
  apps/
    web/   # Next.js (App Router, Tailwind v4, shadcn) — ver apps/web/README.md
    api/   # NestJS (TypeORM, PostgreSQL) — ver apps/api/README.md
  package.json   # workspaces + scripts root
```

Cada app documenta su stack, variables de entorno y comandos en su propio README.
