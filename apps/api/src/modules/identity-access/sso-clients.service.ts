import { Injectable } from '@nestjs/common';
import { HemiaIdAdminClient } from '../../integrations/hemia-id/hemia-id-admin.client';
import { HemiaIdAdminAuth } from '../../integrations/hemia-id/hemia-id-admin.types';
import { CreateSsoClientDto } from './dtos/create-sso-client.dto';
import { UpdateSsoClientDto } from './dtos/update-sso-client.dto';

@Injectable()
export class SsoClientsService {
  constructor(private readonly hemiaIdAdminClient: HemiaIdAdminClient) {}

  findAll(auth: HemiaIdAdminAuth): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'GET',
      path: '/sso-clients',
      auth,
    });
  }

  findOne(id: string, auth: HemiaIdAdminAuth): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'GET',
      path: `/sso-clients/${id}`,
      auth,
    });
  }

  create(dto: CreateSsoClientDto, auth: HemiaIdAdminAuth): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'POST',
      path: '/sso-clients',
      body: dto,
      auth,
    });
  }

  update(
    id: string,
    dto: UpdateSsoClientDto,
    auth: HemiaIdAdminAuth,
  ): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'PATCH',
      path: `/sso-clients/${id}`,
      body: dto,
      auth,
    });
  }

  remove(id: string, auth: HemiaIdAdminAuth): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'DELETE',
      path: `/sso-clients/${id}`,
      auth,
    });
  }
}
