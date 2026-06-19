import { Injectable } from '@nestjs/common';
import { HemiaIdAdminClient } from '../../integrations/hemia-id/hemia-id-admin.client';
import { HemiaIdAdminAuth } from '../../integrations/hemia-id/hemia-id-admin.types';
import { CreateInvitationDto } from './dtos/create-invitation.dto';

@Injectable()
export class InvitationsService {
  constructor(private readonly hemiaIdAdminClient: HemiaIdAdminClient) {}

  create(dto: CreateInvitationDto, auth: HemiaIdAdminAuth): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'POST',
      path: '/invitations',
      body: dto,
      auth,
    });
  }

  resend(id: string, auth: HemiaIdAdminAuth): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'POST',
      path: `/invitations/${id}/resend`,
      auth,
    });
  }

  cancel(id: string, auth: HemiaIdAdminAuth): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'POST',
      path: `/invitations/${id}/cancel`,
      auth,
    });
  }
}
