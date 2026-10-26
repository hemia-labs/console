import { loadApiScopes } from '../../integrations/hemia-id/oauth-catalog';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SystemCatalogLock } from './system-catalog.lock';
import {
  BillingAdminClient,
  type BillingOptions,
} from './billing-admin.client';
import { HemiaIdAdminClient } from '../../integrations/hemia-id/hemia-id-admin.client';
import type { ConsoleRequest } from '../auth/authorization/console-authorization.service';
import { LegalSystemCatalogClient } from './legal-system-catalog.client';
import type {
  Capability,
  Destination,
  IdentityClient,
  SystemDraft,
  SystemRecord,
} from './system-contracts';

@Injectable()
export class SystemOAuthService {
  constructor(
    private readonly legal: LegalSystemCatalogClient,
    private readonly identity: HemiaIdAdminClient,
    private readonly billing: BillingAdminClient,
    private readonly config: ConfigService,
    private readonly lock: SystemCatalogLock,
  ) {}

  async clients(): Promise<IdentityClient[]> {
    const clients = await this.identity.requestService<IdentityClient[]>({
      method: 'GET',
      path: '/oauth-clients',
    });
    if (!Array.isArray(clients))
      throw new ServiceUnavailableException(
        'Identity no devolvió su catálogo de clientes.',
      );
    return clients;
  }

  async choices(req: ConsoleRequest) {
    const [choices, scopes] = await Promise.all([
      this.legal.request('GET', 'choices', req),
      loadApiScopes(this.identity),
    ]);
    if (!choices || typeof choices !== 'object' || !Array.isArray(scopes))
      throw new ServiceUnavailableException('Catálogo no disponible.');
    return {
      ...choices,
      scopes,
      audiences: [
        ...new Set(scopes.filter((s) => s.enabled).map((s) => s.audience)),
      ].sort(),
    };
  }

  activeClient(clients: IdentityClient[], clientId: string) {
    const client = clients.find((item) => item.clientId === clientId);
    if (
      !client ||
      client.status !== 'active' ||
      client.type !== 'confidential' ||
      !client.grantTypes.includes('client_credentials')
    )
      throw new BadRequestException(
        'Selecciona un cliente de servicio activo en Identity.',
      );
    return client;
  }

  async validateService(
    req: ConsoleRequest,
    service: { url: string; resource: string; audience: string },
  ) {
    if (!service.audience || /\s/.test(service.audience))
      throw new BadRequestException('El servicio necesita una audiencia.');
    const target = (await this.legal.request(
      'POST',
      'service-destinations/validate',
      req,
      { url: service.url },
    )) as { resource: string };
    if (target.resource !== service.resource)
      throw new BadRequestException(
        'El recurso OAuth debe coincidir con el origen del servicio.',
      );
  }

  async grant(client: IdentityClient, destination: Destination) {
    const current = client.serviceDestinations?.find(
      (d) =>
        d.resource === destination.resource ||
        d.audience === destination.audience,
    );
    if (
      current &&
      (current.resource !== destination.resource ||
        current.audience !== destination.audience)
    )
      throw new ConflictException(
        'El cliente ya tiene otra relación entre esta API y su audiencia. Revisa el destino antes de cambiarlo.',
      );
    const updated = await this.identity.requestService<IdentityClient>({
      method: 'PUT',
      path: `/oauth-clients/${encodeURIComponent(client.id)}/service-destinations`,
      body: destination,
    });
    if (
      updated.clientId !== client.clientId ||
      !updated.serviceDestinations?.some(
        (d) =>
          d.resource === destination.resource &&
          d.audience === destination.audience &&
          destination.scopes.every((s) => d.scopes.includes(s)),
      )
    )
      throw new ServiceUnavailableException(
        'Identity no confirmó los permisos de la conexión.',
      );
    client.serviceDestinations = updated.serviceDestinations;
  }

  save(req: ConsoleRequest, value: SystemDraft, id?: string) {
    return this.lock.run((assertHeld) =>
      this.saveWithinLock(req, value, id, assertHeld),
    );
  }

  async saveWithinLock(
    req: ConsoleRequest,
    value: SystemDraft,
    id: string | undefined,
    assertHeld: () => Promise<void>,
  ) {
    // Validate the full new model before granting anything. Legal owns schema validation.
    await this.legal.request(
      'POST',
      id ? `systems/validate?id=${encodeURIComponent(id)}` : 'systems/validate',
      req,
      value,
    );
    const [clients, capabilities, scopes, choices, systems] = await Promise.all(
      [
        this.clients(),
        this.legal.request('GET', 'capabilities', req) as Promise<Capability[]>,
        loadApiScopes(this.identity),
        this.legal.request('GET', 'choices', req) as Promise<{
          oauthIssuer: string;
          verificationClientId: string;
        }>,
        this.legal.request('GET', 'systems', req) as Promise<SystemRecord[]>,
      ],
    );
    const hasPayments = Boolean(
      value.configuration.payments ||
      systems.find((s) => s.id === id)?.configuration.payments,
    );
    const billingOptions = hasPayments
      ? await this.billing.request<BillingOptions>(req, 'GET', 'options')
      : undefined;
    const outbound = (system: SystemDraft) => {
      const payments = system.configuration.payments;
      if (!system.enabled || !payments || !billingOptions) return [];
      const roles = system.clients
        .filter((c) => c.enabled && c.capabilityCode === 'payments')
        .flatMap((c) => c.roles);
      return [
        {
          code: roles.includes('receiver')
            ? payments.receiverService
            : undefined,
          clientId: billingOptions?.service.clientId,
          scope: 'billing.webhooks.deliver',
        },
        {
          code:
            roles.includes('checkout') && roles.includes('catalog')
              ? payments.checkService
              : undefined,
          clientId: this.config.getOrThrow<string>('hemiaId.service.clientId'),
          scope: 'billing.connections.check',
        },
      ].flatMap((ref) => {
        if (!ref.code) return [];
        const service = system.services.find(
          (s) => s.enabled && s.code === ref.code,
        );
        if (!service || !ref.clientId) return [];
        return [
          {
            clientId: ref.clientId,
            destination: {
              resource: service.resource,
              audience: service.audience,
              scopes: [ref.scope],
            },
          },
        ];
      });
    };
    const grants: { client: IdentityClient; destination: Destination }[] = [];
    for (const binding of value.clients.filter(
      (c) =>
        value.enabled &&
        c.enabled &&
        Object.hasOwn(value.configuration, c.capabilityCode),
    )) {
      if (binding.oauthIssuer !== choices.oauthIssuer)
        throw new BadRequestException(
          'El emisor del cliente no coincide con Identity.',
        );
      const client = this.activeClient(clients, binding.clientId);
      const capability = capabilities.find(
        (c) => c.code === binding.capabilityCode,
      );
      for (const role of binding.roles) {
        const fn = capability?.functions.find((f) => f.code === role);
        if (!fn?.scopes.length)
          throw new BadRequestException(
            'La función seleccionada no tiene permisos.',
          );
        for (const ref of fn.scopes) {
          const scope = scopes.find(
            (s) =>
              s.code === ref.code && s.audience === ref.audience && s.enabled,
          );
          if (!scope?.resource)
            throw new BadRequestException(
              'Hay permisos sin un servicio registrado.',
            );
          grants.push({
            client,
            destination: {
              resource: scope.resource,
              audience: scope.audience,
              scopes: [scope.code],
            },
          });
        }
      }
    }
    for (const service of value.services.filter(
      (s) => value.enabled && s.enabled,
    ))
      await this.validateService(req, service);
    const contextCode = value.clients.some(
      (c) =>
        c.enabled &&
        c.capabilityCode === 'legalAcceptances' &&
        c.roles.includes('collector'),
    )
      ? value.configuration.legalAcceptances?.contextService
      : undefined;
    if (value.enabled && contextCode) {
      const service = value.services.find(
        (s) => s.code === contextCode && s.enabled,
      );
      if (!service)
        throw new BadRequestException('Selecciona el servicio de contexto.');
      grants.push({
        client: this.activeClient(clients, choices.verificationClientId),
        destination: {
          resource: service.resource,
          audience: service.audience,
          scopes: ['legal.consumer_context.read'],
        },
      });
    }
    for (const permission of outbound(value))
      grants.push({
        client: this.activeClient(clients, permission.clientId),
        destination: permission.destination,
      });
    const permissions = (records: SystemDraft[]) => {
      const result = new Map<
        string,
        { clientId: string; destination: Destination }
      >();
      const add = (
        clientId: string,
        resource: string,
        audience: string,
        code: string,
      ) => {
        const key = JSON.stringify([clientId, resource, audience, code]);
        result.set(key, {
          clientId,
          destination: { resource, audience, scopes: [code] },
        });
      };
      for (const system of records.filter((s) => s.enabled)) {
        for (const permission of outbound(system))
          add(
            permission.clientId,
            permission.destination.resource,
            permission.destination.audience,
            permission.destination.scopes[0],
          );

        for (const binding of system.clients.filter(
          (c) =>
            c.enabled && Object.hasOwn(system.configuration, c.capabilityCode),
        )) {
          const definition = capabilities.find(
            (c) => c.code === binding.capabilityCode,
          );
          for (const fn of (definition?.functions ?? []).filter((f) =>
            binding.roles.includes(f.code),
          ))
            for (const ref of fn.scopes) {
              const scope = scopes.find(
                (s) => s.code === ref.code && s.audience === ref.audience,
              );
              if (scope?.resource)
                add(
                  binding.clientId,
                  scope.resource,
                  scope.audience,
                  scope.code,
                );
            }
        }
        const context = system.services.find(
          (service) =>
            service.enabled &&
            service.code ===
              system.configuration.legalAcceptances?.contextService,
        );
        if (
          context &&
          choices.verificationClientId &&
          system.clients.some(
            (c) =>
              c.enabled &&
              c.capabilityCode === 'legalAcceptances' &&
              c.roles.includes('collector'),
          )
        )
          add(
            choices.verificationClientId,
            context.resource,
            context.audience,
            'legal.consumer_context.read',
          );
      }
      return result;
    };
    const previous = permissions(systems);
    const desired = permissions([...systems.filter((s) => s.id !== id), value]);
    for (const [key, retired] of previous) {
      if (desired.has(key)) continue;
      const client = clients.find((c) => c.clientId === retired.clientId);
      if (!client) continue;
      const destination = client.serviceDestinations?.find(
        (d) =>
          d.resource === retired.destination.resource &&
          d.audience === retired.destination.audience,
      );
      const retiredScopes = retired.destination.scopes.filter((scope) =>
        destination?.scopes.includes(scope),
      );
      if (!retiredScopes.length) continue;
      await assertHeld();
      const updated = await this.identity.requestService<IdentityClient>({
        method: 'DELETE',
        path: `/oauth-clients/${encodeURIComponent(client.id)}/service-destinations`,
        body: { ...retired.destination, scopes: retiredScopes },
      });
      client.serviceDestinations = updated.serviceDestinations;
    }
    // Only the server coordinates grants and persistence; retry uses the same identities.
    for (const { client, destination } of grants) {
      await assertHeld();
      await this.grant(client, destination);
    }
    await assertHeld();
    return this.legal.request(
      id ? 'PUT' : 'POST',
      id ? `systems/${id}` : 'systems',
      req,
      value,
    );
  }
}
