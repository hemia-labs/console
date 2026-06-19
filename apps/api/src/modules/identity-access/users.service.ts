import { Injectable } from '@nestjs/common';
import { HemiaIdAdminClient } from '../../integrations/hemia-id/hemia-id-admin.client';
import {
  HemiaIdAdminAuth,
  HemiaIdAdminQueryValue,
} from '../../integrations/hemia-id/hemia-id-admin.types';
import { CreateUserDto } from './dtos/create-user.dto';
import { ListUsersQueryDto } from './dtos/list-users-query.dto';
import { UpdateUserStatusDto } from './dtos/update-user-status.dto';
import { UpdateUserDto } from './dtos/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly hemiaIdAdminClient: HemiaIdAdminClient) {}

  findAll(query: ListUsersQueryDto, auth: HemiaIdAdminAuth): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'GET',
      path: '/users',
      query: query as Record<string, HemiaIdAdminQueryValue>,
      auth,
    });
  }

  findOne(id: string, auth: HemiaIdAdminAuth): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'GET',
      path: `/users/${id}`,
      auth,
    });
  }

  create(dto: CreateUserDto, auth: HemiaIdAdminAuth): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'POST',
      path: '/users',
      body: dto,
      auth,
    });
  }

  update(
    id: string,
    dto: UpdateUserDto,
    auth: HemiaIdAdminAuth,
  ): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'PATCH',
      path: `/users/${id}`,
      body: dto,
      auth,
    });
  }

  updateStatus(
    id: string,
    dto: UpdateUserStatusDto,
    auth: HemiaIdAdminAuth,
  ): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'PATCH',
      path: `/users/${id}/status`,
      body: dto,
      auth,
    });
  }

  lock(id: string, auth: HemiaIdAdminAuth): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'PATCH',
      path: `/users/${id}/lock`,
      auth,
    });
  }

  unlock(id: string, auth: HemiaIdAdminAuth): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'PATCH',
      path: `/users/${id}/unlock`,
      auth,
    });
  }

  remove(id: string, auth: HemiaIdAdminAuth): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'DELETE',
      path: `/users/${id}`,
      auth,
    });
  }
}
