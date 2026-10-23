import { isDeepStrictEqual } from 'node:util';
import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ConsoleRequest } from '../auth/authorization/console-authorization.service';
import { LegalSystemCatalogClient } from './legal-system-catalog.client';
import {
  BillingAdminClient,
  type BillingOptions,
  type BillingPolicy,
} from './billing-admin.client';
import { ConsoleServiceClient } from './console-service.client';
import { SystemOAuthService } from './system-oauth.service';
import { SystemCatalogLock } from './system-catalog.lock';
import type {
  Capability,
  SystemRecord,
  SystemBinding,
} from './system-contracts';
import type { SystemConnectionDto } from './system-connection.dto';

type LegalOptions = {
  applications: { id: string; name: string }[];
  documents: { id: string; name: string; applicationId: string }[];
  integrations: {
    id: string;
    systemId: string;
    applicationId: string;
    documentIds: string[];
    enabled: boolean;
  }[];
};
type Choices = {
  oauthIssuer: string;
  verificationClientId?: string;
  clients: { clientId: string }[];
};
const fail = (message: string): never => {
  throw new BadRequestException(message);
};
const text = (value: unknown) =>
  typeof value === 'string' ? value : undefined;

@Injectable()
export class SystemConnectionsService {
  constructor(
    private readonly legal: LegalSystemCatalogClient,
    private readonly billing: BillingAdminClient,
    private readonly oauth: SystemOAuthService,
    private readonly transport: ConsoleServiceClient,
    private readonly config: ConfigService,
    private readonly lock: SystemCatalogLock,
  ) {}
  async options(req: ConsoleRequest) {
    const [systems, capabilities, choices] = await Promise.all([
      this.legal.request('GET', 'systems', req) as Promise<SystemRecord[]>,
      this.legal.request('GET', 'capabilities', req) as Promise<Capability[]>,
      this.oauth.choices(req),
    ]);
    return { systems, capabilities, choices };
  }
  paymentOptions(req: ConsoleRequest) {
    return this.billing.request<BillingOptions>(req, 'GET', 'options');
  }
  legalOptions(req: ConsoleRequest) {
    return this.legal.request(
      'GET',
      'integration-options',
      req,
    ) as Promise<LegalOptions>;
  }
  activate(req: ConsoleRequest, dto: SystemConnectionDto) {
    return this.lock.run((assertHeld) =>
      this.activateLocked(req, dto, assertHeld),
    );
  }
  private async activateLocked(
    req: ConsoleRequest,
    dto: SystemConnectionDto,
    assertHeld: () => Promise<void>,
  ) {
    const data = await this.options(req);
    const system = data.systems.find((s) => s.id === dto.systemId && s.enabled);
    if (!system) return fail('Selecciona un sistema habilitado.');
    if (
      !dto.capabilities?.length ||
      new Set(dto.capabilities.map((c) => c.code)).size !==
        dto.capabilities.length
    )
      return fail('Selecciona capacidades sin duplicados.');
    for (const selection of dto.capabilities) {
      const definition = data.capabilities.find(
        (c) => c.code === selection.code,
      );
      if (
        !definition ||
        !selection.functions.length ||
        new Set(selection.functions).size !== selection.functions.length ||
        selection.functions.some(
          (code) => !definition.functions.some((f) => f.code === code),
        )
      )
        return fail('Selecciona funciones disponibles en el catálogo.');
      const fields = definition.schema?.fields ?? [];
      for (const key of Object.keys(selection.configuration ?? {})) {
        const field = fields.find((f) => f.key === key);
        if (
          !field ||
          (field.functions &&
            !field.functions.some((f) => selection.functions.includes(f)))
        )
          return fail(
            'La configuración contiene campos ajenos a las funciones seleccionadas.',
          );
      }
    }
    const roles = (code: string) =>
      dto.capabilities.find((c) => c.code === code)?.functions ?? [];
    const payments = roles('payments');
    const createsCheckout = payments.includes('checkout');
    const checkout = createsCheckout || payments.includes('subscriptions');
    const hasCatalog =
      payments.includes('catalog') || payments.includes('subscriptions');
    const receiverEnabled = payments.includes('receiver');
    const consumerOperations = payments.some((r) =>
      ['catalog', 'checkout', 'licenses', 'subscriptions'].includes(r),
    );
    const organizationRequired =
      checkout ||
      payments.includes('licenses') ||
      payments.includes('subscriptions');
    const collector = roles('legalAcceptances').includes('collector');
    if (!payments.length && dto.payments)
      return fail('Los datos de pagos requieren una función de Pagos.');
    if (!collector && dto.legal)
      return fail(
        'Aplicación y documentos solo corresponden a Registrar aceptaciones.',
      );
    if (payments.length && !dto.payments)
      return fail('Selecciona el producto de la conexión.');
    if (dto.payments) {
      if (
        !checkout &&
        (dto.payments.successUrl ||
          dto.payments.cancelUrl ||
          dto.payments.checkService)
      )
        return fail(
          'Los retornos y la comprobación corresponden a Crear cobros o Gestionar suscripciones.',
        );
      if (!receiverEnabled && dto.payments.receiverService)
        return fail('El receptor corresponde a Recibir licencias.');
      if (
        !organizationRequired &&
        (dto.payments.organizationScope || dto.payments.organizationIds?.length)
      )
        return fail('Esta función no necesita un alcance de organizaciones.');
      // Known product/payment fields have one authority: the named selectors, never a second JSON payload.
      if (
        Object.keys(
          dto.capabilities.find((c) => c.code === 'payments')?.configuration ??
            {},
        ).some((k) =>
          [
            'productCode',
            'successUrl',
            'cancelUrl',
            'receiverService',
            'checkService',
          ].includes(k),
        )
      )
        return fail(
          'Usa los selectores de pagos para configurar producto y servicios.',
        );
    }
    const choices = data.choices as unknown as Choices;
    if (!choices.oauthIssuer)
      throw new ServiceUnavailableException(
        'No se pudo confirmar el emisor de Identity.',
      );
    const identityClients = await this.oauth.clients();
    const candidates = [
      ...new Set(
        system.clients
          .filter(
            (c) =>
              c.enabled &&
              !(
                c.capabilityCode === 'legalAcceptances' &&
                c.roles.every((r) => r === 'validator')
              ) &&
              identityClients.some(
                (i) =>
                  i.clientId === c.clientId &&
                  i.status === 'active' &&
                  i.type === 'confidential' &&
                  i.grantTypes.includes('client_credentials'),
              ),
          )
          .map((c) => c.clientId),
      ),
    ];
    const clientId =
      dto.clientId ?? (candidates.length === 1 ? candidates[0] : undefined);
    if (!clientId)
      return fail(
        'Selecciona el cliente del backend; no hay una identidad única registrada.',
      );
    const consumer = this.oauth.activeClient(identityClients, clientId);
    const consoleId = this.config.getOrThrow<string>(
      'hemiaId.service.clientId',
    );
    if (clientId === consoleId || clientId === choices.verificationClientId)
      return fail('Selecciona la identidad propia del backend consumidor.');
    const billing = payments.length
      ? await this.paymentOptions(req)
      : undefined;
    if (billing?.service.clientId === clientId)
      return fail('Selecciona la identidad propia del backend consumidor.');
    const legal = collector ? await this.legalOptions(req) : undefined;
    const currentIntegration = legal?.integrations.find(
      (i) => i.systemId === system.id && i.enabled,
    );
    const integration = dto.legal ?? currentIntegration;
    if (
      collector &&
      (!integration ||
        !integration.documentIds.length ||
        !legal?.applications.some((a) => a.id === integration.applicationId) ||
        integration.documentIds.some(
          (id) =>
            !legal.documents.some(
              (d) =>
                d.id === id && d.applicationId === integration.applicationId,
            ),
        ))
    )
      return fail('Selecciona documentos publicados de la aplicación elegida.');
    if (
      collector &&
      system.clients.some(
        (c) =>
          c.enabled &&
          c.capabilityCode === 'legalAcceptances' &&
          c.roles.includes('collector') &&
          c.clientId !== clientId,
      )
    )
      return fail(
        'El sistema registra aceptaciones con otro cliente. Reutilízalo o retira esa función desde el sistema.',
      );
    if (
      payments.length &&
      system.clients.some(
        (c) =>
          c.enabled &&
          c.capabilityCode === 'payments' &&
          c.clientId !== clientId,
      )
    )
      return fail(
        'El sistema usa otro cliente de pagos. Reutilízalo o retira esa conexión antes de cambiarlo.',
      );
    const next: SystemRecord = {
      ...system,
      configuration: { ...system.configuration },
      services: system.services.map((s) => ({ ...s })),
      clients: system.clients.map((c) => ({ ...c, roles: [...c.roles] })),
    };
    const addBinding = (binding: SystemBinding) => {
      const current = next.clients.find(
        (c) =>
          c.oauthIssuer === binding.oauthIssuer &&
          c.clientId === binding.clientId &&
          c.capabilityCode === binding.capabilityCode,
      );
      if (current) {
        current.roles = [...new Set([...current.roles, ...binding.roles])];
        current.enabled = true;
      } else next.clients.push(binding);
    };
    for (const selection of dto.capabilities) {
      next.configuration[selection.code] = {
        ...system.configuration[selection.code],
        ...selection.configuration,
      };
      addBinding({
        oauthIssuer: choices.oauthIssuer,
        clientId,
        capabilityCode: selection.code,
        roles: selection.functions,
        enabled: true,
      });
    }
    const oldPayments = system.configuration.payments ?? {};
    const settings = dto.payments;
    const productCode = settings?.productCode;
    if (billing && !billing.products.some((p) => p.code === productCode))
      return fail('Selecciona un producto disponible.');
    if (
      payments.length &&
      oldPayments.productCode &&
      oldPayments.productCode !== productCode
    )
      return fail(
        'El sistema ya usa otro producto. Cambia su conexión desde el editor antes de sustituirlo.',
      );
    const previous = billing?.policies.find((p) => p.clientId === clientId);
    let policy: Omit<BillingPolicy, 'clientId'> | undefined;
    let success: string | undefined, cancel: string | undefined;
    const backendBaseUrl = settings?.backendBaseUrl;
    if (backendBaseUrl) {
      if (!receiverEnabled && !checkout && !collector)
        return fail(
          'La URL del backend requiere checkout, receptor o contexto Legal.',
        );
      if (
        settings.receiverService ||
        settings.checkService ||
        dto.capabilities.find((c) => c.code === 'legalAcceptances')
          ?.configuration?.contextService
      )
        return fail(
          'Usa la URL base o los servicios personalizados, no ambos.',
        );
      let base: URL;
      try {
        base = this.transport.endpoint(backendBaseUrl);
      } catch {
        return fail(
          'La URL base del backend debe ser HTTPS o loopback de desarrollo.',
        );
      }
      if (
        backendBaseUrl.includes('?') ||
        backendBaseUrl.includes('#') ||
        base.search ||
        base.hash ||
        base.username ||
        base.password ||
        (base.protocol !== 'https:' &&
          !(
            base.protocol === 'http:' &&
            ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname) &&
            process.env.NODE_ENV !== 'production'
          ))
      )
        return fail(
          'La URL base del backend debe ser segura y no contener parámetros ni credenciales.',
        );
      if (!consumer.audience || /\s/.test(consumer.audience))
        return fail(
          'El cliente del backend necesita una audiencia configurada en Identity.',
        );
      const register = (code: string, path: string) => {
        const generated = {
          code,
          name: code,
          url: base.href.replace(/\/+$/, '') + path,
          audience: consumer.audience,
          resource: base.origin,
          enabled: true,
        };
        const current = next.services.find((s) => s.code === code);
        if (
          current &&
          (current.url !== generated.url ||
            current.audience !== generated.audience ||
            current.resource !== generated.resource)
        )
          return fail(
            'El servicio estándar ya tiene otro destino. Revisa el sistema antes de cambiarlo.',
          );
        if (current) Object.assign(current, generated);
        else next.services.push(generated);
        return code;
      };
      if (receiverEnabled)
        next.configuration.payments.receiverService = register(
          'payments-license',
          '/payments/webhooks/license',
        );
      if (checkout && hasCatalog)
        next.configuration.payments.checkService = register(
          'payments-check',
          '/payments/integration-status',
        );
      if (collector)
        next.configuration.legalAcceptances.contextService = register(
          'payments-legal-context',
          '/payments/legal/context',
        );
    }
    const service = (value: unknown, label: string) => {
      const found = next.services.find((s) => s.enabled && s.code === value);
      if (!found)
        return fail(`Selecciona un servicio registrado para ${label}.`);
      return found;
    };
    const receiver = receiverEnabled
      ? service(
          backendBaseUrl
            ? next.configuration.payments.receiverService
            : (settings?.receiverService ?? oldPayments.receiverService),
          'recibir licencias',
        )
      : undefined;
    const checkCode = checkout
      ? backendBaseUrl
        ? text(next.configuration.payments.checkService)
        : (settings?.checkService ?? text(oldPayments.checkService))
      : undefined;
    const check = checkCode
      ? service(checkCode, 'comprobar el backend')
      : undefined;
    const context = collector
      ? service(
          next.configuration.legalAcceptances?.contextService,
          'verificar el contexto',
        )
      : undefined;
    const incoming = receiver ?? check ?? context;
    if (context && incoming && context.audience !== incoming.audience)
      return fail('Los servicios del mismo backend deben compartir audiencia.');
    if (checkout) {
      success = settings?.successUrl ?? text(oldPayments.successUrl);
      cancel = settings?.cancelUrl ?? text(oldPayments.cancelUrl);
      if (!success || !cancel)
        return fail('Completa los retornos al finalizar y cancelar el pago.');
      this.transport.endpoint(success);
      this.transport.endpoint(cancel);
    }
    if (checkout && collector) {
      next.configuration.legalAcceptances.productCode = productCode;
      const billingClient = this.oauth.activeClient(
        identityClients,
        billing!.service.clientId,
      );
      addBinding({
        oauthIssuer: choices.oauthIssuer,
        clientId: billingClient.clientId,
        capabilityCode: 'legalAcceptances',
        roles: ['validator'],
        enabled: true,
      });
    }
    if (settings)
      next.configuration.payments = {
        ...next.configuration.payments,
        productCode,
        ...(checkout
          ? {
              successUrl: success,
              cancelUrl: cancel,
              ...(check ? { checkService: check.code } : {}),
            }
          : {}),
        ...(receiver ? { receiverService: receiver.code } : {}),
      };
    if (receiver) {
      if (
        data.systems.some(
          (s) =>
            s.id !== system.id &&
            s.enabled &&
            s.configuration.payments?.productCode === productCode &&
            s.configuration.payments?.receiverService,
        )
      )
        return fail('Este producto ya tiene un receptor en otro sistema.');
      const registered = billing!.receivers.find(
        (r) => r.productCode === productCode && r.enabled,
      );
      if (
        registered &&
        registered.url !== receiver.url &&
        oldPayments.productCode !== productCode
      )
        return fail(
          'El producto ya tiene otro receptor autorizado. Revisa esa conexión antes de sustituirlo.',
        );
      await this.oauth.validateService(req, receiver);
    }
    if (check) await this.oauth.validateService(req, check);
    if (consumerOperations) {
      const scope = organizationRequired
        ? (settings?.organizationScope ?? previous?.organizationScope)
        : (previous?.organizationScope ?? 'organizations');
      const organizations = organizationRequired
        ? (settings?.organizationIds ?? previous?.organizationIds ?? [])
        : (previous?.organizationIds ?? []);
      if (
        !scope ||
        (scope === 'organizations' &&
          organizationRequired &&
          !organizations.length) ||
        organizations.some(
          (id) => !billing!.organizations.some((o) => o.id === id),
        ) ||
        (scope === 'all_for_allowed_products' && organizations.length)
      )
        return fail('Selecciona un alcance de organizaciones válido.');
      if (
        previous?.products.some((p) => p !== productCode) &&
        (previous.organizationScope !== scope ||
          JSON.stringify([...(previous.organizationIds ?? [])].sort()) !==
            JSON.stringify([...organizations].sort()))
      )
        return fail(
          'Este cliente sirve otros productos. Conserva su alcance o revisa su política en Billing.',
        );
      const existingScopes =
        consumer.serviceDestinations
          ?.filter(
            (d) =>
              d.audience === billing!.service.audience &&
              d.resource === this.billing.baseUrl().origin,
          )
          .flatMap((d) => d.scopes) ?? [];
      if (
        previous &&
        !previous.products.includes(productCode!) &&
        ((!createsCheckout &&
          existingScopes.includes('billing.integration.checkout.create')) ||
          (!checkout &&
            existingScopes.includes('billing.integration.checkout.read')) ||
          (!payments.includes('licenses') &&
            existingScopes.includes('billing.integration.licenses.read')) ||
          (!payments.includes('subscriptions') &&
            existingScopes.includes('billing.subscriptions.manage')))
      )
        return fail(
          'El cliente tiene otras funciones de Billing. Añadir este producto también ampliaría esas funciones; utiliza una conexión con el alcance explícito correspondiente.',
        );
      const desiredScopes = data.capabilities
        .find((c) => c.code === 'payments')!
        .functions.filter((f) => payments.includes(f.code))
        .flatMap((f) =>
          f.scopes
            .filter((s) => s.audience === billing!.service.audience)
            .map((s) => s.code),
        );
      if (
        previous?.products.some((p) => p !== productCode) &&
        desiredScopes.some((s) => !existingScopes.includes(s))
      )
        return fail(
          'El cliente sirve otros productos. Una función nueva también les daría permisos; revisa primero el alcance compartido en Billing.',
        );
      const hasOrganizationOperations = existingScopes.some((s) =>
        [
          'billing.integration.checkout.create',
          'billing.integration.checkout.read',
          'billing.integration.licenses.read',
          'billing.subscriptions.manage',
        ].includes(s),
      );
      if (
        hasOrganizationOperations &&
        scope === 'organizations' &&
        !organizations.length
      )
        return fail(
          'El cliente ya tiene funciones que requieren organizaciones. Reutiliza su política con alcance o selecciona esas funciones para configurarlo.',
        );
      if (
        !checkout &&
        existingScopes.includes('billing.integration.checkout.create') &&
        !previous?.allowedReturnOrigins.length
      )
        return fail(
          'El cliente ya puede crear cobros y requiere URLs de retorno autorizadas. Selecciona esa función para configurarlas.',
        );
      policy = {
        enabled: true,
        products: [...new Set([...(previous?.products ?? []), productCode!])],
        organizationScope: scope,
        ...(scope === 'organizations'
          ? { organizationIds: organizations }
          : {}),
        allowedReturnOrigins: [
          ...new Set([
            ...(previous?.allowedReturnOrigins ?? []),
            ...(checkout
              ? [new URL(success!).origin, new URL(cancel!).origin]
              : []),
          ]),
        ],
        allowSharedCheckouts: previous?.allowSharedCheckouts ?? false,
      };
    }
    const { id, ...draft } = next;
    await this.legal.request(
      'POST',
      `systems/validate?id=${encodeURIComponent(id)}`,
      req,
      draft,
    );
    const configuration: Record<string, string> = {};
    let connection: Record<string, unknown> | undefined;
    if (consumerOperations) {
      const base = this.billing.baseUrl();
      connection = {
        issuer: choices.oauthIssuer,
        tokenUrl: new URL(
          this.config.getOrThrow<string>('hemiaId.service.tokenUrl'),
          choices.oauthIssuer,
        ).href,
        clientId,
        baseUrl: new URL('/api/v1', base).href,
        resource: base.origin,
        audience: billing!.service.audience,
        productCode,
        ...(incoming
          ? {
              receiver: {
                audience: incoming.audience,
                billingClientId: billing!.service.clientId,
                consoleClientId: this.config.getOrThrow<string>(
                  'hemiaId.service.clientId',
                ),
              },
            }
          : {}),
        ...(collector
          ? {
              legal: {
                baseUrl: new URL(
                  this.config.getOrThrow<string>('legalAdmin.baseUrl'),
                ).origin,
                audience: 'legal-api',
                resource: new URL(
                  this.config.getOrThrow<string>('legalAdmin.baseUrl'),
                ).origin,
                verificationClientId: choices.verificationClientId,
              },
            }
          : {}),
        ...(text(next.configuration.payments.successUrl)
          ? { successUrl: next.configuration.payments.successUrl }
          : {}),
        ...(text(next.configuration.payments.cancelUrl)
          ? { cancelUrl: next.configuration.payments.cancelUrl }
          : {}),
        ...(base.protocol === 'http:' ? { allowHttpLoopback: true } : {}),
      };
      configuration.PAYMENTS_CONNECTION = JSON.stringify(connection);
    }
    const legalConnection = collector
      ? {
          baseUrl: new URL(this.config.getOrThrow<string>('legalAdmin.baseUrl'))
            .origin,
          identityIssuer: choices.oauthIssuer,
          jwksUrl: new URL('/.well-known/jwks.json', choices.oauthIssuer).href,
        }
      : undefined;
    if (legalConnection)
      Object.assign(configuration, {
        LEGAL_API_BASE_URL: legalConnection.baseUrl,
        LEGAL_CONTEXT_IDENTITY_ISSUER: legalConnection.identityIssuer,
        LEGAL_CONTEXT_JWKS_URL: legalConnection.jwksUrl,
      });
    const operations: [string, () => Promise<unknown>][] = [
      [
        'Sistema y funciones',
        () => this.oauth.saveWithinLock(req, draft, id, assertHeld),
      ],
    ];
    if (policy)
      operations.push([
        'Autorización de Billing',
        () =>
          this.billing.request(
            req,
            'PUT',
            `clients/${encodeURIComponent(clientId)}`,
            policy,
          ),
      ]);
    if (collector)
      operations.push([
        'Aplicación y documentos',
        () =>
          this.legal.request('PUT', 'integrations', req, {
            systemId: id,
            applicationId: integration!.applicationId,
            documentIds: integration!.documentIds,
            enabled: true,
          }),
      ]);
    if (receiver)
      operations.push(
        [
          'Receptor de licencias',
          () =>
            this.billing.request(
              req,
              'PUT',
              `receivers/${encodeURIComponent(productCode!)}`,
              {
                url: receiver.url,
                audience: receiver.audience,
                resource: receiver.resource,
                enabled: true,
              },
            ),
        ],
        [
          'Contrato de recepción',
          () =>
            this.billing.request(
              req,
              'POST',
              `receivers/${encodeURIComponent(productCode!)}/check`,
            ),
        ],
      );
    const verifyBackend = Boolean(check && checkout && hasCatalog);
    if (verifyBackend)
      operations.push([
        'Configuración del backend',
        async () => {
          const result = await this.transport.request<{
            ready: boolean;
            clientId: string;
            productCode: string;
            connection: Record<string, unknown>;
            legalConnection: Record<string, unknown>;
          }>(
            req,
            {
              url: check!.url,
              resource: check!.resource,
              audience: check!.audience,
              scope: 'billing.connections.check',
            },
            'GET',
          );
          if (
            result.ready !== true ||
            result.clientId !== clientId ||
            result.productCode !== productCode ||
            !result.connection ||
            Object.entries(connection!).some(
              ([key, value]) =>
                !isDeepStrictEqual(result.connection[key], value),
            ) ||
            (legalConnection !== undefined &&
              (!result.legalConnection ||
                Object.entries(legalConnection).some(
                  ([key, value]) => result.legalConnection[key] !== value,
                )))
          )
            return fail(
              'Instala la configuración generada en el backend y vuelve a comprobar.',
            );
        },
      ]);
    const steps: {
      name: string;
      state: 'done' | 'pending';
      message?: string;
    }[] = [];
    for (const [name, operation] of operations) {
      try {
        await assertHeld();
        await operation();
        steps.push({ name, state: 'done' });
      } catch (error) {
        steps.push({
          name,
          state: 'pending',
          message:
            error instanceof Error
              ? error.message
              : 'No se pudo completar el paso.',
        });
        return {
          ready: false,
          status: 'pending' as const,
          steps,
          configuration,
          secretVariable: 'HEMIA_CLIENT_SECRET',
        };
      }
    }
    const verified =
      verifyBackend &&
      dto.capabilities.every((c) =>
        ['payments', 'legalAcceptances'].includes(c.code),
      );
    return {
      ready: verified,
      status: verified ? ('verified' as const) : ('configured' as const),
      steps,
      configuration,
      secretVariable: 'HEMIA_CLIENT_SECRET',
    };
  }
}
