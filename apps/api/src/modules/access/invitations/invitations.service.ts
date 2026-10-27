import { Injectable } from '@nestjs/common';
import { AccessAdminClient } from '../../../integrations/access/access-admin.client';
import {
  CreateInvitationDto,
  ListInvitationsQueryDto,
} from '../dtos/access.dto';

@Injectable()
export class InvitationsService {
  constructor(private readonly accessAdminClient: AccessAdminClient) {}

  create(
    organizationId: string,
    dto: CreateInvitationDto,
    accessToken: string,
  ): Promise<unknown> {
    return this.accessAdminClient.requestAsUser(
      {
        method: 'POST',
        path: `/v1/organizations/${organizationId}/invitations`,
        body: dto,
      },
      accessToken,
    );
  }

  findAll(organizationId: string, accessToken: string): Promise<unknown> {
    return this.accessAdminClient.requestAsUser(
      {
        method: 'GET',
        path: `/v1/organizations/${organizationId}/invitations`,
      },
      accessToken,
    );
  }

  listAll(
    query: ListInvitationsQueryDto,
    accessToken: string,
  ): Promise<unknown> {
    return this.accessAdminClient.requestAsUser(
      { method: 'GET', path: '/v1/invitations', query: { ...query } },
      accessToken,
    );
  }

  findOne(invitationId: string, accessToken: string): Promise<unknown> {
    return this.accessAdminClient.requestAsUser(
      {
        method: 'GET',
        path: `/v1/invitations/${invitationId}`,
      },
      accessToken,
    );
  }

  revoke(invitationId: string, accessToken: string): Promise<unknown> {
    return this.accessAdminClient.requestAsUser(
      {
        method: 'POST',
        path: `/v1/invitations/${invitationId}/revoke`,
      },
      accessToken,
    );
  }

  resend(invitationId: string, accessToken: string): Promise<unknown> {
    return this.accessAdminClient.requestAsUser(
      {
        method: 'POST',
        path: `/v1/invitations/${invitationId}/resend`,
      },
      accessToken,
    );
  }
}
