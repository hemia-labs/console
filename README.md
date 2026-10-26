# nextjs-nestjs

Monorepo con **Next.js** (frontend) y **NestJS** (backend), gestionado con **bun workspaces**.

## Apps

| App | Stack | Puerto | README |
|-----|-------|--------|--------|
| [`apps/web`](apps/web) | Next.js 16, React 19, Tailwind v4, shadcn | 5176 | [ver](apps/web/README.md) |
| [`apps/api`](apps/api) | NestJS 11, Redis | 3016 | [ver](apps/api/README.md) |

> Console API no requiere PostgreSQL. Redis conserva las sesiones SSO.

## Requisitos

- [bun](https://bun.sh)
- Redis para las sesiones SSO de `apps/api`

## Arranque

```bash
bun install

bun run dev        # inicia frontend; ejecutar dev:api en otra terminal
bun run dev:web    # solo frontend (http://localhost:5176)
bun run dev:api    # solo backend  (http://localhost:3016)
```

## Build

```bash
bun run build      # build de todas las apps
```

## Avance Identity & Access backend

`apps/api` ya incluye la integracion backend de **Hemia Console** con **Hemia ID** para identidad y **Hemia Access** para organizaciones y autorización. El backend funciona como gateway/admin BFF bajo el modulo `identity-access`.

Estado actual:

- Identity Access expone salud, usuarios, clientes OAuth y consultas de cuentas. Access expone organizaciones, membresías, invitaciones, productos, roles y catálogos de roles de sistema.
- Tests centralizados en `test/`: `test/api/unit`, `test/api/e2e` y `test/web`. Ejecuta todos desde la raíz con `bun run test`; también existen `test:api`, `test:e2e` y `test:web`.
- Los módulos API agrupan controladores, servicios y contratos por funcionalidad: Access por recurso, Identity Access por usuarios, clientes OAuth, cuentas y salud; Auth por autorización y sesiones Redis.
- Console no almacena eventos de auditoría locales ni requiere DB/migraciones; identidad y acceso se administran en los servicios upstream.

Documentos de seguimiento:

- [API administrativa](apps/api/README.md)

## Estructura

```
nextjs-nestjs/
  apps/
    web/   # Next.js (App Router, Tailwind v4, shadcn) — ver apps/web/README.md
    api/   # NestJS (Redis para SSO) — ver apps/api/README.md
  package.json   # workspaces + scripts root
```

Cada app documenta su stack, variables de entorno y comandos en su propio README.

## Limpieza de integraciones retiradas

Console conserva usuarios, clientes OAuth, consultas de cuenta y administración vigente de Access. Las pantallas y proxies de workload, managed policies y policy plans fueron retirados junto con los módulos legacy no registrados. Las cuentas solo exponen las consultas que Identity mantiene; no hay proxies de cambio o eliminación de cuentas.

## Catálogo de Sistemas

Console administra `/es/catalogs/systems` y `/es/catalogs/system-capabilities`. El alta `/es/catalogs/systems/connections/new` permite seleccionar capacidades y funciones; muestra únicamente sus campos aplicables y reutiliza el cliente y los servicios registrados en el sistema. Si hay un único cliente reutilizable se selecciona automáticamente; si hay varios se elige uno. Agregar funciones conserva las existentes; retirarlas se administra desde el sistema.

**Conectar pagos** abre el mismo formulario con `?preset=payments` y las funciones de pagos preseleccionadas. Consultar planes solo requiere producto; consultar licencias añade alcance de organizaciones. Crear cobros requiere retornos. Hemia Legal es opcional: si la aplicación ya gestiona sus documentos, puede cobrar sin `legalAcceptanceId`. Seleccionar Registrar aceptaciones habilita la aplicación y documentos de Hemia Legal; cualquier aceptación enviada a Billing se valida. El flujo estándar solicita una sola URL base del backend, incluido su prefijo API. Console registra `/payments/webhooks/license`, `/payments/integration-status` y, con Hemia Legal, `/payments/legal/context`; usa el origen como recurso OAuth y la audiencia configurada del cliente backend en Identity. La URL no acepta parámetros, fragmentos ni credenciales; HTTP se limita a loopback de desarrollo. La opción avanzada conserva los servicios personalizados existentes. El namespace de identidad de Legal conserva su configuración explícita: no se deduce del emisor OAuth. La primera activación puede quedar pendiente hasta instalar la configuración generada y reintentar la comprobación.

Los catálogos permanecen en Legal. Cada campo del esquema puede declarar `functions`; los campos sin esta propiedad aplican a toda la capacidad. Las capacidades nuevas se conectan mediante sus funciones, scopes y esquema sin agregar coordinadores específicos. Billing y Legal se consultan solo cuando las funciones seleccionadas requieren sus catálogos. Antes del corte se debe ejecutar la migración Legal `1792886400000` de aplicabilidad por función, además de las migraciones de conexiones previas. No hay compatibilidad con el wizard anterior.

El BFF exige administrador de plataforma y reutiliza su credencial `console-identity-admin` (`IDENTITY_ADMIN_CLIENT_SECRET`) para APIs administrativas, sin enviar tokens al navegador. Registrar en Identity los destinos Legal (`legal.systems.read/write`), Billing (`billing.integrations.read/manage`) y las APIs consumidoras para comprobación. Configurar `LEGAL_API_URL` y `BILLING_API_BASE_URL` una vez por ambiente. No se usan `LEGAL_ADMIN_*` ni el guardado OAuth separado del navegador.

`GET /legal/system-catalog/connections/options` devuelve sistemas/capacidades/opciones de identidad. `/connections/options/payments` y `/connections/options/legal` cargan los catálogos de dominio a demanda. `POST /connections/activate` recibe funciones y configuración aplicable, con bloques de pagos/aceptaciones únicamente cuando se requieren. Valida antes de escribir y rechaza ampliaciones implícitas de permisos sobre otros productos del mismo cliente.

El resultado distingue `configured` (guardado, sin prueba operativa), `verified` (comprobación del backend completada) y `pending` (paso pendiente, reintentable). Solo `verified` devuelve `ready: true`. La configuración generada `PAYMENTS_CONNECTION` no contiene secretos; el consumidor usa `@hemia/payments` y `HEMIA_CLIENT_SECRET` desde su despliegue. Las operaciones de lectura no requieren URLs de retorno; `checkout.create` sí las exige. La configuración y su secreto deben estar instalados antes de comprobar el backend.

## Despliegue

API y web tienen imágenes Docker y usan Redis externo. GitHub Actions valida los cambios; al mergear a `main`, se crea o actualiza una PR de versión. Al mergear esa PR, se publican tag, GitHub Release e imágenes y se despliega automáticamente si `ENABLE_CONSOLE_DEPLOY=true`.

### Versiones y releases

Incluye un changeset con `bun run changeset` en cada PR que requiera una nueva versión. API y web comparten versión; no se publican a npm. La nota inicial prepara la primera release `console-v0.2.0`.

- PR a `main`: lint, tests, builds y smoke Docker.
- Merge funcional: validaciones y PR `changeset-release/console` con versiones, changelogs y lockfile actualizados. CI se dispara explícitamente para esa rama cuando la PR la crea `GITHUB_TOKEN`.
- Merge de la PR de versión: vuelve a validar, publica imágenes por digest, crea tag `console-vX.Y.Z` y release inmutable con assets, y despliega ese bundle vía SSH. No reconstruye durante el despliegue.
- `Console release` permite reintentar la publicación de la versión actual mediante `release_tag`. `Console deployment` permite volver a desplegar un tag publicado, sin volver a publicar ni construir imágenes.

El environment `prod` conserva los secretos y `ENABLE_CONSOLE_DEPLOY`. El repositorio debe permitir que Actions cree PRs y tener activada la inmutabilidad de releases. La PR de versión usa la GitHub App `hemia-ci` mediante `RELEASE_APP_CLIENT_ID` y `RELEASE_APP_PRIVATE_KEY`, con token limitado a Console. Si la app no está configurada, usa `GITHUB_TOKEN` y dispara CI explícitamente; no requiere un token personal adicional. Las releases verifican commit, checksums e imágenes; los reintentos no reemplazan assets ni tags existentes.
