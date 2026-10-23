import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HemiaIdAdminClient } from '../../integrations/hemia-id/hemia-id-admin.client';
import { LegalSystemCatalogClient } from './legal-system-catalog.client';
import type { ConsoleRequest } from '../auth/authorization/console-authorization.service';
import type { CreateCapabilityClientDto } from './capability-client.dto';
type Scope = {
  code: string;
  audience: string;
  resource: string | null;
  enabled: boolean;
};
type Capability = {
  code: string;
  functions: { code: string; scopes: { code: string; audience: string }[] }[];
};
type Destination = { resource: string; audience: string; scopes: string[] };
@Injectable()
export class CapabilityClientsService {
  constructor(
    private readonly legal: LegalSystemCatalogClient,
    private readonly identity: HemiaIdAdminClient,
  ) {}
  async create(req: ConsoleRequest, dto: CreateCapabilityClientDto) {
    const [definitions, catalog, choices] = await Promise.all([
      this.legal.request('GET', 'capabilities', req),
      this.identity.requestService<unknown>({
        method: 'GET',
        path: '/oauth-scopes',
      }),
      this.legal.request('GET', 'choices', req),
    ]);
    if (
      !Array.isArray(definitions) ||
      !Array.isArray(catalog) ||
      !choices ||
      typeof choices !== 'object' ||
      !('oauthIssuer' in choices) ||
      typeof choices.oauthIssuer !== 'string'
    )
      throw new ServiceUnavailableException(
        'No se pudo consultar la configuración de capacidades.',
      );
    const capability = (definitions as Capability[]).find(
      (c) => c.code === dto.capabilityCode,
    );
    const functions = dto.roles.map((role) =>
      capability?.functions.find((f) => f.code === role),
    );
    if (!functions.length || functions.some((fn) => !fn?.scopes.length))
      throw new BadRequestException(
        'Selecciona funciones con permisos definidos.',
      );
    const references = functions.flatMap((fn) => fn!.scopes);
    if (references.length > 100)
      throw new BadRequestException('Demasiados permisos seleccionados.');
    const destinations: Destination[] = [];
    for (const reference of references) {
      const scope = (catalog as Scope[]).find(
        (s) => s.audience === reference.audience && s.code === reference.code,
      );
      if (!scope?.enabled || !scope.resource)
        throw new BadRequestException(
          'La función tiene un permiso deshabilitado o sin URL de API. Revisa el catálogo de scopes.',
        );
      const byAudience = destinations.find(
        (d) => d.audience === scope.audience,
      );
      const byResource = destinations.find(
        (d) => d.resource === scope.resource,
      );
      if (
        (byAudience && byAudience.resource !== scope.resource) ||
        (byResource && byResource.audience !== scope.audience)
      )
        throw new BadRequestException(
          'Los permisos de la función tienen destinos OAuth incompatibles.',
        );
      if (byAudience) {
        if (!byAudience.scopes.includes(scope.code))
          byAudience.scopes.push(scope.code);
      } else
        destinations.push({
          resource: scope.resource,
          audience: scope.audience,
          scopes: [scope.code],
        });
    }
    if (destinations.length > 32)
      throw new BadRequestException('La función requiere demasiadas APIs.');
    const created = await this.identity.requestService<{
      id: string;
      clientId: string;
      clientSecret: string;
    }>({
      method: 'POST',
      path: '/oauth-clients',
      body: {
        clientId: dto.clientId,
        audience: destinations[0].audience,
        type: 'confidential',
        grantTypes: ['client_credentials'],
        responseTypes: [],
        redirectUris: [],
        requiresConsent: false,
        status: 'active',
        scopes: [],
        serviceDestinations: destinations,
      },
    });
    if (
      !created ||
      typeof created.id !== 'string' ||
      created.clientId !== dto.clientId ||
      typeof created.clientSecret !== 'string' ||
      !created.clientSecret
    )
      throw new ServiceUnavailableException(
        'Identity no confirmó la creación del cliente. Revisa su catálogo antes de reintentar.',
      );
    return {
      client: {
        id: created.id,
        clientId: created.clientId,
        name: created.clientId,
        oauthIssuer: choices.oauthIssuer,
        scopes: [],
        serviceDestinations: destinations,
      },
      clientSecret: created.clientSecret,
    };
  }
}
