import { Injectable } from '@nestjs/common';
import { HemiaIdAdminClient } from '../../integrations/hemia-id/hemia-id-admin.client';
import { HemiaIdAdminAuth } from '../../integrations/hemia-id/hemia-id-admin.types';
import { CreateTenantDto } from './dtos/create-tenant.dto';
import { UpdateTenantStatusDto } from './dtos/update-tenant-status.dto';
import { UpdateTenantDto } from './dtos/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly hemiaIdAdminClient: HemiaIdAdminClient) {}

  findAll(auth: HemiaIdAdminAuth): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'GET',
      path: '/tenants',
      auth,
    });
  }

  findOne(id: string, auth: HemiaIdAdminAuth): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'GET',
      path: `/tenants/${id}`,
      auth,
    });
  }

  create(dto: CreateTenantDto, auth: HemiaIdAdminAuth): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'POST',
      path: '/tenants',
      body: dto,
      auth,
    });
  }

  update(
    id: string,
    dto: UpdateTenantDto,
    auth: HemiaIdAdminAuth,
  ): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'PATCH',
      path: `/tenants/${id}`,
      body: dto,
      auth,
    });
  }

  updateStatus(
    id: string,
    dto: UpdateTenantStatusDto,
    auth: HemiaIdAdminAuth,
  ): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'PATCH',
      path: `/tenants/${id}/status`,
      body: dto,
      auth,
    });
  }

  remove(id: string, auth: HemiaIdAdminAuth): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'DELETE',
      path: `/tenants/${id}`,
      auth,
    });
  }
}
