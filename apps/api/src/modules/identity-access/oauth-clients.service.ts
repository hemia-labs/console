import { Injectable } from '@nestjs/common';
import { HemiaIdAdminClient } from '../../integrations/hemia-id/hemia-id-admin.client';
import {
  HemiaIdAdminAuth,
  HemiaIdAdminMethod,
} from '../../integrations/hemia-id/hemia-id-admin.types';
import { CreateOAuthClientDto } from './dtos/create-oauth-client.dto';
import { OAuthClientListValueDto } from './dtos/oauth-client-list-value.dto';
import { UpdateOAuthClientDto } from './dtos/update-oauth-client.dto';

export type OAuthClientListPath =
  | 'redirect-uris'
  | 'scopes'
  | 'grant-types'
  | 'response-types';

@Injectable()
export class OAuthClientsService {
  constructor(private readonly hemiaIdAdminClient: HemiaIdAdminClient) {}

  findAll(auth: HemiaIdAdminAuth): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'GET',
      path: '/oauth-clients',
      auth,
    });
  }

  findOne(id: string, auth: HemiaIdAdminAuth): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'GET',
      path: `/oauth-clients/${id}`,
      auth,
    });
  }

  create(dto: CreateOAuthClientDto, auth: HemiaIdAdminAuth): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'POST',
      path: '/oauth-clients',
      body: dto,
      auth,
    });
  }

  update(
    id: string,
    dto: UpdateOAuthClientDto,
    auth: HemiaIdAdminAuth,
  ): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'PATCH',
      path: `/oauth-clients/${id}`,
      body: dto,
      auth,
    });
  }

  rotateSecret(id: string, auth: HemiaIdAdminAuth): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'POST',
      path: `/oauth-clients/${id}/rotate-secret`,
      auth,
    });
  }

  addListValue(
    id: string,
    listPath: OAuthClientListPath,
    dto: OAuthClientListValueDto,
    auth: HemiaIdAdminAuth,
  ): Promise<unknown> {
    return this.sendListValue('POST', id, listPath, dto, auth);
  }

  removeListValue(
    id: string,
    listPath: OAuthClientListPath,
    dto: OAuthClientListValueDto,
    auth: HemiaIdAdminAuth,
  ): Promise<unknown> {
    return this.sendListValue('DELETE', id, listPath, dto, auth);
  }

  remove(id: string, auth: HemiaIdAdminAuth): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'DELETE',
      path: `/oauth-clients/${id}`,
      auth,
    });
  }

  private sendListValue(
    method: HemiaIdAdminMethod,
    id: string,
    listPath: OAuthClientListPath,
    dto: OAuthClientListValueDto,
    auth: HemiaIdAdminAuth,
  ): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method,
      path: `/oauth-clients/${id}/${listPath}`,
      body: dto,
      auth,
    });
  }
}
