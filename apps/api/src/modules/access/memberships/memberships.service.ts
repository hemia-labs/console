import { Injectable } from '@nestjs/common';
import { AccessAdminClient } from '../../../integrations/access/access-admin.client';
import { CreateMembershipDto, UpdateMembershipDto } from '../dtos/access.dto';

@Injectable()
export class MembershipsService {
  constructor(private readonly accessAdminClient: AccessAdminClient) {}

  findAll(organizationId: string, accessToken: string): Promise<unknown> {
    return this.accessAdminClient.requestAsUser(
      {
        method: 'GET',
        path: `/v1/organizations/${organizationId}/memberships`,
      },
      accessToken,
    );
  }

  findOne(
    organizationId: string,
    membershipId: string,
    accessToken: string,
  ): Promise<unknown> {
    return this.accessAdminClient.requestAsUser(
      {
        method: 'GET',
        path: `/v1/organizations/${organizationId}/memberships/${membershipId}`,
      },
      accessToken,
    );
  }

  create(
    organizationId: string,
    dto: CreateMembershipDto,
    accessToken: string,
  ): Promise<unknown> {
    return this.accessAdminClient.requestAsUser(
      {
        method: 'POST',
        path: `/v1/organizations/${organizationId}/memberships`,
        body: dto,
      },
      accessToken,
    );
  }

  update(
    organizationId: string,
    membershipId: string,
    dto: UpdateMembershipDto,
    accessToken: string,
  ): Promise<unknown> {
    return this.accessAdminClient.requestAsUser(
      {
        method: 'PATCH',
        path: `/v1/organizations/${organizationId}/memberships/${membershipId}`,
        body: dto,
      },
      accessToken,
    );
  }

  suspend(
    organizationId: string,
    membershipId: string,
    accessToken: string,
  ): Promise<unknown> {
    return this.changeStatus(
      organizationId,
      membershipId,
      'suspend',
      accessToken,
    );
  }

  activate(
    organizationId: string,
    membershipId: string,
    accessToken: string,
  ): Promise<unknown> {
    return this.changeStatus(
      organizationId,
      membershipId,
      'activate',
      accessToken,
    );
  }

  revoke(
    organizationId: string,
    membershipId: string,
    accessToken: string,
  ): Promise<unknown> {
    return this.changeStatus(
      organizationId,
      membershipId,
      'revoke',
      accessToken,
    );
  }

  private changeStatus(
    organizationId: string,
    membershipId: string,
    action: string,
    accessToken: string,
  ): Promise<unknown> {
    return this.accessAdminClient.requestAsUser(
      {
        method: 'POST',
        path: `/v1/organizations/${organizationId}/memberships/${membershipId}/${action}`,
      },
      accessToken,
    );
  }
}
