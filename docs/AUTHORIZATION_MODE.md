# Autorización por roles y permisos

Console admite únicamente `HEMIA_AUTHORIZATION_MODE=roles` (predeterminado). El antiguo valor `authenticated` se rechaza antes del arranque. Access, Legal y Billing deben desplegarse con autorización por roles y asignaciones explícitas revisadas; una sesión SSO por sí sola no concede funciones administrativas.

Cada operación de Console requiere membresía activa, producto Console habilitado y contexto firmado vigente vinculado a la identidad, organización y membresía de la sesión. El contexto debe incluir el rol global `platform_super_admin` y el permiso efectivo `*`. Console vuelve a resolver autoridad en cada petición para detectar revocaciones. Un rol de organización o la lectura de un producto no permite administrar la plataforma.

Las acciones de Access usan el token del usuario y conservan su ámbito y auditoría. Las llamadas técnicas conservan las credenciales de servicio y el actor autorizado. No se asignan roles ni se cambian usuarios, datos o políticas de máquinas automáticamente. Revisar y aprovisionar únicamente los roles y alcances necesarios antes del despliegue; no requiere migración de esquema.
