import { Injectable } from '@nestjs/common';
import { AccessAdminClient } from '../../integrations/access/access-admin.client';
import { CreateInvitationDto } from './dtos/access.dto';

@Injectable()
export class InvitationsService {
  constructor(private readonly accessAdminClient: AccessAdminClient) {}

  create(organizationId: string, dto: CreateInvitationDto): Promise<unknown> {
    return this.accessAdminClient.request({
      method: 'POST',
      path: `/v1/organizations/${organizationId}/invitations`,
      body: dto,
    });
  }

  findAll(organizationId: string): Promise<unknown> {
    return this.accessAdminClient.request({
      method: 'GET',
      path: `/v1/organizations/${organizationId}/invitations`,
    });
  }

  findOne(invitationId: string): Promise<unknown> {
    return this.accessAdminClient.request({
      method: 'GET',
      path: `/v1/invitations/${invitationId}`,
    });
  }

  revoke(invitationId: string): Promise<unknown> {
    return this.accessAdminClient.request({
      method: 'POST',
      path: `/v1/invitations/${invitationId}/revoke`,
    });
  }

  resend(invitationId: string): Promise<unknown> {
    return this.accessAdminClient.request({
      method: 'POST',
      path: `/v1/invitations/${invitationId}/resend`,
    });
  }
}
