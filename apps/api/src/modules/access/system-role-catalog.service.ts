import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccessAdminClient } from '../../integrations/access/access-admin.client';
import {
  ConsoleAuthorizationService,
  type ConsoleRequest,
} from '../auth/console-authorization.service';

@Injectable()
export class SystemRoleCatalogService {
  constructor(
    private readonly access: AccessAdminClient,
    private readonly authorization: ConsoleAuthorizationService,
  ) {}
  async list(request: ConsoleRequest): Promise<unknown> {
    const token = await this.authorization.accessTokenFor(request);
    return this.access.requestAsUser(
      { method: 'GET', path: '/v1/system-roles/catalogs' },
      token,
    );
  }
  async publish(
    request: ConsoleRequest,
    productCode: string,
    version: string,
    body: unknown,
  ): Promise<unknown> {
    if (
      !/^[a-z][a-z0-9_]*$/.test(productCode) ||
      !/^v[1-9][0-9]*$/.test(version)
    )
      throw new NotFoundException('Unsupported system role catalog');
    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body) ||
      Object.keys(body).length
    )
      throw new BadRequestException('Catalog publication body must be empty');
    const token = await this.authorization.accessTokenFor(request);
    return this.access.requestAsUser(
      {
        method: 'POST',
        path: `/v1/system-roles/catalogs/${productCode}/${version}`,
        body: {},
      },
      token,
    );
  }
}
