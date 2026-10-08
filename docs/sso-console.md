# SSO y autorización de Console

Console usa `@hemia/auth` 1.0.8. El navegador recibe `console_session`, una cookie opaca HttpOnly; OAuth tokens y refresh tokens permanecen en Redis. `/me` devuelve únicamente `sub`, `iss`, `email`, `name`; `/auth/session` devuelve `{ authenticated: true, user }` con esos mismos campos.

Cada consulta de sesión y operación administrativa vuelve a intercambiar el token del usuario. Consulta `/v1/me/context?product=console` para descubrir organizaciones y usa `AccessClient.resolveSystemContext` con `product_code: console` y audiencia fija `console-api`. La autorización depende del JWT firmado de Access, con perfil `hemia-context+jwt`, RS256 y contrato versión 1. El SDK valida firma/JWKS, issuer, audiencia escalar y tiempos; Console vincula identidad, organización y membresía con su sesión y exige estados activos, producto Console habilitado, rol `platform_super_admin` y permiso `*` en los claims verificados. Prueba otra organización activa si Access deniega la primera. No usa roles/permisos del GET ni el contexto del login para conceder acceso, caché de autorización o RabbitMQ. Cada petición, incluidas lecturas, solicita otra resolución. La caché de claves públicas del SDK no conserva permisos.

## Configuración por entorno

- Desarrollo: Identity `http://localhost:4000`; Console API `http://localhost:3016`; web `http://localhost:5176`; Access `http://localhost:3019`.
- Login: cliente confidencial `console`, audiencia `console-api`, callback de API `/auth/callback`, secret `SSO_CLIENT_SECRET` y scope `openid profile email offline_access console.access`.
- Administración Identity: cliente `console-identity-admin`, audiencia `identity-api`, secret `IDENTITY_ADMIN_CLIENT_SECRET`. Debe permitir los scopes `identity.users.{read,create,update,lock,unlock,delete}` e `identity.oauth_clients.{read,create,update,delete}`. Sustituir explícitamente la configuración anterior `SSO_IDENTITY_ADMIN_SERVICE_SECRET`; no hay fallback al cliente anterior.
- Administración Access: `console-access-admin`, audiencia `access-api`, secret `ACCESS_CLIENT_SECRET`, scopes documentados en `apps/api/.env.example`.
- `SSO_COOKIE_NAME` y `NEXT_PUBLIC_SSO_COOKIE_NAME` deben coincidir; por defecto `console_session`. Configurar `NEXT_PUBLIC_CONSOLE_API_BASE_URL` y CORS con el origen exacto de web y credenciales habilitadas.
- Access firmado: `ACCESS_API_URL` debe coincidir con `ACCESS_ISSUER` de Access, sin slash final. `ACCESS_JWKS_URI` debe publicar su clave RS256. `ACCESS_AUDIENCE=access-api` sigue siendo la audiencia del token intercambiado; el contexto firmado exige `console-api`. Access debe tener una clave persistente propia del entorno; no generar claves efímeras en producción.
- Producción: configurar URLs HTTPS, `NODE_ENV=production`, secrets propios y Redis exclusivo de Console. Cookie `Secure` se exige en producción. No registrar secrets ni tokens en logs.

`401` significa sesión local ausente/expirada; `403`, autorización denegada o JWT que no supera la verificación criptográfica/binding; `503`, Access no disponible, contrato Console malformado/no soportado o configuración administrativa no disponible. El perfil exige `iat=nbf`, `jti` no vacío y una vigencia positiva de hasta 300 segundos. Los rechazos de credenciales de servicio no fuerzan otro login. El frontend espera la validación antes de montar pantallas privadas y cargar sus datos. Las páginas del servidor solo componen la vista; las peticiones privadas se ejecutan al montar componentes dentro de la barrera de sesión y ofrece reintento manual ante fallos de disponibilidad. Los errores del callback se normalizan a `/{lang}/auth/error` sin reintentos automáticos.

## Validación y despliegue conjunto

1. Ejecutar pruebas unitarias y e2e de API, tipos, lint sin `--fix`, pruebas web y builds de ambas apps. Las pruebas SSO usan el SDK y guard reales, Redis simulado y JWKS RSA local; no llaman servicios compartidos ni ejecutan seeds/migraciones.
2. Confirmar en Identity los tres clientes, audiencias, grants, callback y scopes; en Access, la asignación vigente del operador y Console habilitado. Estas comprobaciones son lectura; no sembrar ni migrar durante el arranque.
3. Desplegar primero Access con el contrato firmado Console v1 y verificar issuer/JWKS; después configurar ambos artifacts con la misma cookie y URLs compatibles; desplegar API y frontend como una entrega conjunta. Este repo no define proveedor ni pipeline de despliegue: el entorno de destino debe suministrarse explícitamente.
4. Probar login, `/me`, `/auth/session`, creación administrativa controlada y logout con un superadministrador. Un usuario ordinario debe recibir `403` sin llamadas administrativas. Revocar el rol o suspender membresía/producto y comprobar denegación en la siguiente petición. Interrumpir Access y comprobar `503` sin reutilizar autorización previa ni entrar en un ciclo de login.
5. Observar códigos de error y auditoría por `sub` autenticado; nunca almacenar cookies o tokens. No revertir la barrera de autorización ante un fallo de configuración.

No se requieren cambios de esquema. No ejecutar migraciones ni seeds. Las funciones de scopes personalizados/Balanz quedan fuera de esta entrega.

## Resultado de esta implementación

- API Console: 99 pruebas unitarias y 111 e2e aprobadas; tipos y build aprobados. La suite SSO usa el guard real e incluye pérdida del rol, usuarios ordinarios/sin organizaciones, suspensión, producto deshabilitado, errores de Access también durante refresh, cookies, PKCE, concurrencia y logout.
- Access: 156 pruebas unitarias aprobadas, tipos de producción y build aprobados; contexto Console firmado con 29 comprobaciones SQL aprobadas en PostgreSQL 18 desechable. Incluye vencimientos, revocación, suspensiones, rol global frente a rol organizacional y permiso efectivo aportado por otra asignación vigente.
- Web: 24 pruebas aprobadas; tipos, lint y build aprobados. La regresión de páginas del servidor comprueba que preparar la vista no llama a endpoints privados antes de la validación.
- Navegador local con API de prueba: `401` conserva `/es/identity/users?search=ana` al volver al login; la página pública de error no relanza login. `403` y `503` producen cero llamadas privadas; `503` reintenta únicamente por acción del usuario. Con respuesta de sesión demorada, las llamadas privadas ocurren después de finalizar la validación.
- El lint de los archivos SSO revisados pasa. El lint completo de API, ejecutado sin modificaciones automáticas, mantiene 119 errores preexistentes de formato y tipos en migraciones, auditoría, integraciones y pruebas. No se hizo una limpieza general de esos archivos.
- Los archivos modificados del contexto firmado pasan lint sin `--fix`. Access mantiene 201 errores de lint global y nueve errores de tipos en pruebas anteriores (`organization-eligibility`, `roles.service`, DTO de Legal); los tipos de producción y el build pasan. Estos errores están fuera de los archivos del contrato firmado.
- No se ejecutaron migraciones ni seeds. Los cambios locales anteriores se conservaron.

El despliegue de Access seguido de la entrega conjunta de Console y la prueba final con cuentas reales quedan pendientes del entorno de destino, su mecanismo de despliegue y la configuración de Console (DB, Redis, tres secretos OAuth y URLs). Las pruebas anteriores usan identidades de prueba y servicios simulados; no sustituyen esa comprobación en el entorno elegido.

## Prueba local con cuenta real — 2026-10-03

Se iniciaron Access API (`localhost:3019`), Identity web (`localhost:5173`), Console API (`localhost:3016`) y Console web (`localhost:5176`); se reutilizó Identity API que ya estaba en `localhost:4000`. Las bases y Redis son los configurados en cada `.env.local`. Los servicios quedan disponibles al finalizar.

Con `admin@hemia.mx` se comprobó:

- Login real en el navegador, dashboard, avatar con la cuenta correcta y pantalla de organizaciones con datos reales.
- `/auth/session` y `/me`: `200`, `Cache-Control: no-store` y únicamente los campos públicos de identidad. Sin cookie: `401` también en lecturas administrativas.
- Contexto firmado real verificado por el SDK: contrato 1, audiencia Console, identidad/membresía coincidentes, `platform_super_admin`, `*` y organización/producto activos. Tres resoluciones devolvieron identificadores distintos.
- Lecturas de organizaciones, productos, roles y permisos: `200`.
- Ocho consultas concurrentes a una sesión forzada a refresh completaron con `200`, con rotación de access/refresh tokens solo en Redis. Una copia de prueba vencida y sin refresh devolvió `401` y fue eliminada.
- Pausa temporal de la instancia de Access iniciada para esta prueba: `/me`, `/auth/session` y organizaciones devolvieron `503` tras el timeout, conservando la sesión. Al reanudar Access, sesión y organizaciones respondieron `200`.
- Callback PKCE real: cookie UUID opaca, HttpOnly, SameSite=Lax, Path=/ y TTL configurado. Logout eliminó la sesión/cookie de Console y revocó/limpió Identity; el siguiente acceso exigió login. También se comprobó logout desde la interfaz.

**Bloqueo encontrado en esta prueba, resuelto en la verificación posterior:** `/identity-access/users` y `/identity-access/oauth-clients` devolvieron `503` al faltar `IDENTITY_ADMIN_CLIENT_SECRET`. La credencial local bajo el nombre anterior no autenticaba al cliente dedicado `console-identity-admin`. Ese fallo conservó la sesión del operador; el SSO firmado siguió respondiendo `200`.

La contraseña de prueba no se guardó en archivos. No se ejecutaron migraciones ni seeds ni se modificaron organizaciones, roles o permisos. La revocación de un rol real y el acceso con una cuenta ordinaria siguen cubiertos por las regresiones automatizadas; esta comprobación manual utilizó únicamente la cuenta indicada.


## Credencial administrativa configurada y prueba real — 2026-10-04

Se verificó que `console-identity-admin` existe y está activo en Identity. Tras la rotación autorizada de su secreto, se configuró `IDENTITY_ADMIN_CLIENT_SECRET` exclusivamente en `apps/api/.env.local` (ignorado por Git y con permisos `0600`) y se reinició Console API. El secreto no se incluye en esta documentación ni en los reportes de pruebas.

- Login real en el navegador con `admin@hemia.mx`: aprobado; las pantallas de usuarios y clientes OAuth muestran datos. El cliente `console-identity-admin` aparece activo y la cuenta del avatar coincide con la indicada.
- `/auth/session`, `/me`, `/identity-access/users` y `/identity-access/oauth-clients`: `200`. Las respuestas de identidad mantienen solamente los cuatro campos públicos y `no-store`.
- Las lecturas de organizaciones, productos, roles y permisos de Access responden `200`; el SDK valida el contexto firmado y tres resoluciones devuelven identificadores distintos.
- Ocho peticiones concurrentes completan el refresh con `200` y rotación de los tokens del backend. Sesión ausente o copia vencida sin refresh: `401`.
- Logout desde el avatar: volvió al formulario de Hemia ID y exigió un nuevo inicio de sesión.
- El reporte de esta verificación no contiene bloqueos de configuración. No se hicieron cambios administrativos de datos ni se ejecutaron migraciones o seeds. La prueba con usuario ordinario real, revocación real de roles y el despliegue en el entorno de destino siguen pendientes; los casos negativos tienen cobertura automatizada.
