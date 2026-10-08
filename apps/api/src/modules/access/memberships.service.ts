import { Injectable } from '@nestjs/common';
import { AccessAdminClient } from '../../integrations/access/access-admin.client';
import { CreateMembershipDto, UpdateMembershipDto } from './dtos/access.dto';

@Injectable()
export class MembershipsService {
  constructor(private readonly accessAdminClient: AccessAdminClient) {}

  findAll(organizationId: string): Promise<unknown> {
    return this.accessAdminClient.request({
      method: 'GET',
      path: `/v1/organizations/${organizationId}/memberships`,
    });
  }

  findOne(organizationId: string, membershipId: string): Promise<unknown> {
    return this.accessAdminClient.request({
      method: 'GET',
      path: `/v1/organizations/${organizationId}/memberships/${membershipId}`,
    });
  }

  create(organizationId: string, dto: CreateMembershipDto): Promise<unknown> {
    return this.accessAdminClient.request({
      method: 'POST',
      path: `/v1/organizations/${organizationId}/memberships`,
      body: dto,
    });
  }

  update(
    organizationId: string,
    membershipId: string,
    dto: UpdateMembershipDto,
  ): Promise<unknown> {
    return this.accessAdminClient.request({
      method: 'PATCH',
      path: `/v1/organizations/${organizationId}/memberships/${membershipId}`,
      body: dto,
    });
  }

  suspend(organizationId: string, membershipId: string): Promise<unknown> {
    return this.changeStatus(organizationId, membershipId, 'suspend');
  }

  activate(organizationId: string, membershipId: string): Promise<unknown> {
    return this.changeStatus(organizationId, membershipId, 'activate');
  }

  revoke(organizationId: string, membershipId: string): Promise<unknown> {
    return this.changeStatus(organizationId, membershipId, 'revoke');
  }

  private changeStatus(
    organizationId: string,
    membershipId: string,
    action: string,
  ): Promise<unknown> {
    return this.accessAdminClient.request({
      method: 'POST',
      path: `/v1/organizations/${organizationId}/memberships/${membershipId}/${action}`,
    });
  }
}
