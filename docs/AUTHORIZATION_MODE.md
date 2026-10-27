# Modo temporal de acciones sin roles

Configurar `HEMIA_AUTHORIZATION_MODE=authenticated` en el backend de Console,
Access, Legal y Billing y recrear los servicios. Funciona en local y producción.
La opción predeterminada es `roles`; para restaurar límites cambiar a `roles` y
recrear los backends. No se asignan roles ni se modifican usuarios automáticamente.

Entrar a Console requiere sesión válida de Identity. Sus acciones administrativas
conservan membresía interna activa, Console habilitado y contexto firmado; solo
se omite comprobar roles/permisos globales. Las acciones de Access se envían con
el token del usuario para conservar el ámbito y el actor de auditoría.

Los catálogos/sistemas globales quedan administrables por esos operadores sin rol;
las validaciones de datos, estado de negocio y credenciales de servicios continúan.
La reversión no deshace las operaciones ni cambios de configuración realizados.
