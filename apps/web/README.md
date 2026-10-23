# Web (Next.js)

Frontend del monorepo `nextjs-nestjs`. Consola Next.js (App Router) con Tailwind v4, ZUNO y componentes shadcn.


## Stack

- **Next.js 16** — App Router, React Server Components.
- **React 19**.
- **Tailwind CSS v4** — vía `@tailwindcss/postcss`, tokens en `src/app/globals.css`.
- **ZUNO** y **shadcn**, sobre **@base-ui/react** — componentes editables en `src/components/zuno` y `src/components/ui`.
- **lucide-react** — iconos.
- **class-variance-authority**, **clsx**, **tailwind-merge** — variantes y merge de clases.
- **TypeScript**, **ESLint**. Tema claro por defecto y tema oscuro seleccionable desde el perfil; preferencia en `localStorage`.
- Gestor de paquetes: **bun**.

## Estructura

```
apps/web/
  components.json                # config shadcn (style base-nova, baseColor neutral)
  src/
    app/
      layout.tsx                 # layout raíz
      [lang]/                    # rutas públicas y privadas por idioma
      globals.css                # tokens Tailwind v4 + tema shadcn
    components/
      app-sidebar.tsx, app-topbar.tsx
      zuno/                      # componentes del registro ZUNO
      ui/                        # componentes shadcn utilizados
    lib/
      nav.ts, utils.ts           # navegación y helper cn()
```

Aliases: `@/components`, `@/components/ui`, `@/lib`, `@/lib/utils`, `@/hooks`.

## Arranque

```bash
bun install
bun run --cwd apps/web dev      # http://localhost:5176
```

## Scripts

```bash
bun run --cwd apps/web dev
bun run --cwd apps/web build
bun run --cwd apps/web start
bun run --cwd apps/web lint
```

## Añadir componentes shadcn

```bash
bunx shadcn@latest add @zuno/<componente>
```

El registro `@zuno` y el alias `ui` de `components.json` instalan los componentes en `src/components/zuno`.

## Pruebas

Los tests web están en `../../test/web`, dentro de la raíz única de pruebas del proyecto. Ejecuta `bun run test` desde esta aplicación o `bun run test:web` desde la raíz. El script usa la configuración TypeScript de `test/web` para resolver los alias y las dependencias de esta aplicación.
