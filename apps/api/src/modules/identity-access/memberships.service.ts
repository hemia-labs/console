import { Injectable } from '@nestjs/common';
import { HemiaIdAdminClient } from '../../integrations/hemia-id/hemia-id-admin.client';
import {
  HemiaIdAdminAuth,
  HemiaIdAdminQueryValue,
} from '../../integrations/hemia-id/hemia-id-admin.types';
import { CreateMembershipDto } from './dtos/create-membership.dto';
import { ListMembershipsQueryDto } from './dtos/list-memberships-query.dto';
import { UpdateMembershipStatusDto } from './dtos/update-membership-status.dto';

@Injectable()
export class MembershipsService {
  constructor(private readonly hemiaIdAdminClient: HemiaIdAdminClient) {}

  findAll(
    query: ListMembershipsQueryDto,
    auth: HemiaIdAdminAuth,
  ): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'GET',
      path: '/memberships',
      query: query as Record<string, HemiaIdAdminQueryValue>,
      auth,
    });
  }

  create(dto: CreateMembershipDto, auth: HemiaIdAdminAuth): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'POST',
      path: '/memberships',
      body: dto,
      auth,
    });
  }

  updateStatus(
    id: string,
    dto: UpdateMembershipStatusDto,
    auth: HemiaIdAdminAuth,
  ): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'PATCH',
      path: `/memberships/${id}/status`,
      body: dto,
      auth,
    });
  }

  remove(id: string, auth: HemiaIdAdminAuth): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'DELETE',
      path: `/memberships/${id}`,
      auth,
    });
  }
}
