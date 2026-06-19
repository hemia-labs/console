import { Injectable } from '@nestjs/common';
import { HemiaIdAdminClient } from '../../integrations/hemia-id/hemia-id-admin.client';
import { HemiaIdAdminAuth } from '../../integrations/hemia-id/hemia-id-admin.types';
import { CreateTeamDto } from './dtos/create-team.dto';
import { UpdateTeamDto } from './dtos/update-team.dto';

@Injectable()
export class TeamsService {
  constructor(private readonly hemiaIdAdminClient: HemiaIdAdminClient) {}

  findAll(auth: HemiaIdAdminAuth): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'GET',
      path: '/teams',
      auth,
    });
  }

  findOne(id: string, auth: HemiaIdAdminAuth): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'GET',
      path: `/teams/${id}`,
      auth,
    });
  }

  create(dto: CreateTeamDto, auth: HemiaIdAdminAuth): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'POST',
      path: '/teams',
      body: dto,
      auth,
    });
  }

  update(
    id: string,
    dto: UpdateTeamDto,
    auth: HemiaIdAdminAuth,
  ): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'PATCH',
      path: `/teams/${id}`,
      body: dto,
      auth,
    });
  }

  remove(id: string, auth: HemiaIdAdminAuth): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'DELETE',
      path: `/teams/${id}`,
      auth,
    });
  }
}
