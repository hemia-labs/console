# web

## 0.6.0

### Minor Changes

- 24cfee2: Publish secret-free Payments connection snapshots to Billing when saving an integration with catalog access, and deliver Billing origin, connection code, OAuth client ID, and a separate secret placeholder. Preview and checks remain read-only and report unpublished or changed configuration.

  Keep the complete configuration under advanced options and retain explicit delivery for profiles without catalog access, profiles using direct OAuth configuration, and unsupported reference codes. Explain installation from npm with `@hemia/payments` 0.11.0 or later, preserve the reused OAuth client link and secret guidance, and keep system and document selection in Console and Legal.

## 0.5.0

### Minor Changes

- 6683d5b: Make the Console home page a hub for Hemia systems and common administration tasks. Organize OAuth APIs and scopes under Identity, clarify role catalog navigation, and read configured system links at request time. Forward the public Billing, Legal, Balanz and Docs web URLs to the deployed frontend.

  Deduplicate capability function scopes by code and audience when displaying OAuth client permissions.

## 0.4.0

### Minor Changes

- 481528c: Allow authenticated Console operators to perform actions without role restrictions through a reversible configuration mode. Forward Access actions as the current user and provide invitation list and creation pages.

## 0.3.0

### Minor Changes

- 2683276: Enable organization invitations with human authorization, delivery status, resend and revoke.

## 0.2.0

### Minor Changes

- 7f309a1: Preparar Hemia Console para producción con Docker, CI, publicación de releases y despliegue automático.
