import { Injectable } from '@nestjs/common';
import { AccessAdminClient } from '../../integrations/access/access-admin.client';
import { AccessAdminQueryValue } from '../../integrations/access/access-admin.types';
import {
  CreateOrganizationDto,
  ListOrganizationsQueryDto,
  UpdateOrganizationDto,
} from './dtos/access.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly accessAdminClient: AccessAdminClient) {}

  findAll(query: ListOrganizationsQueryDto): Promise<unknown> {
    return this.accessAdminClient.request({
      method: 'GET',
      path: '/v1/organizations',
      query: query as Record<string, AccessAdminQueryValue>,
    });
  }

  findOne(organizationId: string): Promise<unknown> {
    return this.accessAdminClient.request({
      method: 'GET',
      path: `/v1/organizations/${organizationId}`,
    });
  }

  create(dto: CreateOrganizationDto): Promise<unknown> {
    return this.accessAdminClient.request({
      method: 'POST',
      path: '/v1/organizations',
      body: dto,
    });
  }

  update(organizationId: string, dto: UpdateOrganizationDto): Promise<unknown> {
    return this.accessAdminClient.request({
      method: 'PATCH',
      path: `/v1/organizations/${organizationId}`,
      body: dto,
    });
  }

  suspend(organizationId: string): Promise<unknown> {
    return this.changeStatus(organizationId, 'suspend');
  }

  activate(organizationId: string): Promise<unknown> {
    return this.changeStatus(organizationId, 'activate');
  }

  archive(organizationId: string): Promise<unknown> {
    return this.changeStatus(organizationId, 'archive');
  }

  private changeStatus(
    organizationId: string,
    action: string,
  ): Promise<unknown> {
    return this.accessAdminClient.request({
      method: 'POST',
      path: `/v1/organizations/${organizationId}/${action}`,
    });
  }
}
