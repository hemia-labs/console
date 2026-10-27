import { Injectable } from '@nestjs/common';
import { AccessAdminClient } from '../../../integrations/access/access-admin.client';
import { AccessAdminQueryValue } from '../../../integrations/access/access-admin.types';
import {
  CreateOrganizationDto,
  ListOrganizationsQueryDto,
  UpdateOrganizationDto,
} from '../dtos/access.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly accessAdminClient: AccessAdminClient) {}

  findAll(
    query: ListOrganizationsQueryDto,
    accessToken: string,
  ): Promise<unknown> {
    return this.accessAdminClient.requestAsUser(
      {
        method: 'GET',
        path: '/v1/organizations',
        query: query as Record<string, AccessAdminQueryValue>,
      },
      accessToken,
    );
  }

  findOne(organizationId: string, accessToken: string): Promise<unknown> {
    return this.accessAdminClient.requestAsUser(
      {
        method: 'GET',
        path: `/v1/organizations/${organizationId}`,
      },
      accessToken,
    );
  }

  create(dto: CreateOrganizationDto, accessToken: string): Promise<unknown> {
    return this.accessAdminClient.requestAsUser(
      {
        method: 'POST',
        path: '/v1/organizations',
        body: dto,
      },
      accessToken,
    );
  }

  update(
    organizationId: string,
    dto: UpdateOrganizationDto,
    accessToken: string,
  ): Promise<unknown> {
    return this.accessAdminClient.requestAsUser(
      {
        method: 'PATCH',
        path: `/v1/organizations/${organizationId}`,
        body: dto,
      },
      accessToken,
    );
  }

  suspend(organizationId: string, accessToken: string): Promise<unknown> {
    return this.changeStatus(organizationId, 'suspend', accessToken);
  }

  activate(organizationId: string, accessToken: string): Promise<unknown> {
    return this.changeStatus(organizationId, 'activate', accessToken);
  }

  archive(organizationId: string, accessToken: string): Promise<unknown> {
    return this.changeStatus(organizationId, 'archive', accessToken);
  }

  private changeStatus(
    organizationId: string,
    action: string,
    accessToken: string,
  ): Promise<unknown> {
    return this.accessAdminClient.requestAsUser(
      {
        method: 'POST',
        path: `/v1/organizations/${organizationId}/${action}`,
      },
      accessToken,
    );
  }
}
